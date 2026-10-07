'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  DEFAULT_SETTINGS,
  SAMPLE_BRANDS,
  SAMPLE_PRODUCTS,
  kes,
  slugify,
} from '@/lib/util'

/* ============================================================
   IMAGE UPLOAD
   ============================================================ */

async function upload(file, folder) {
  if (!file) return ''

  const bmp = await createImageBitmap(file)

  const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height))

  const canvas = document.createElement('canvas')

  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not process image.')
  }

  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result)
        else reject(new Error('Could not create image.'))
      },
      'image/webp',
      0.82
    )
  })

  const path = `${folder}/${crypto.randomUUID()}.webp`

  const { error } = await supabase.storage.from('images').upload(path, blob, {
    contentType: 'image/webp',
    upsert: false,
  })

  if (error) throw error

  const {
    data: { publicUrl },
  } = supabase.storage.from('images').getPublicUrl(path)

  return publicUrl
}

/* ============================================================
   EMPTY PRODUCT
   ============================================================ */

const EMPTY = {
  name: '',
  sku: '',
  brand_id: '',
  category_id: '',
  price: '',
  compare_at_price: '',
  description: '',
  video: '',
  stock_quantity: '0',
  low_stock_threshold: '5',
  active: true,
  featured: false,
  image: '',
}

/* ============================================================
   ADMIN
   ============================================================ */

export default function Admin() {
  const [user, setUser] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(false)

  const [tab, setTab] = useState('products')

  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])

  const [s, setS] = useState(DEFAULT_SETTINGS)

  const [msg, setMsg] = useState('')

  const toast = (message) => {
    setMsg(message)

    setTimeout(() => {
      setMsg('')
    }, 3000)
  }

  /* ==========================================================
     AUTH / ADMIN CHECK
     ========================================================== */

  useEffect(() => {
    let mounted = true

    const check = async (u) => {
      if (!mounted) return

      setUser(u || null)

      if (!u) {
        setIsAdmin(false)
        return
      }

      const { data, error } = await supabase.rpc('is_admin')

      if (!mounted) return

      if (error) {
        console.error('Admin check failed:', error)
        setIsAdmin(false)
        return
      }

      setIsAdmin(data === true)
    }

    supabase.auth.getSession().then(({ data }) => {
      check(data.session?.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        check(session?.user)
      }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  /* ==========================================================
     LOAD ADMIN DATA
     ========================================================== */

  const load = useCallback(async () => {
    const [brandsResult, categoriesResult, productsResult, settingsResult] =
      await Promise.all([
        supabase.from('brands').select('*').order('name'),

        supabase.from('categories').select('*').order('name'),

        supabase
          .from('products')
          .select(
            `
          *,
          brands:brand_id (
            id,
            name
          ),
          categories:category_id (
            id,
            name
          )
        `
          )
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('settings')
          .select('data')
          .eq('id', 'store')
          .maybeSingle(),
      ])

    if (brandsResult.error) {
      throw brandsResult.error
    }

    if (categoriesResult.error) {
      throw categoriesResult.error
    }

    if (productsResult.error) {
      throw productsResult.error
    }

    setBrands(brandsResult.data || [])

    setCategories(categoriesResult.data || [])

    setProducts(
      (productsResult.data || []).map((p) => ({
        ...p,
        price: Number(p.price),
        compare_at_price:
          p.compare_at_price === null ? null : Number(p.compare_at_price),
        stock_quantity: Number(p.stock_quantity || 0),
        low_stock_threshold: Number(p.low_stock_threshold || 0),
      }))
    )

    const settingsData = settingsResult.data?.data

    if (settingsData) {
      setS({
        ...DEFAULT_SETTINGS,
        ...settingsData,
        hero: settingsData.hero?.length
          ? settingsData.hero
          : DEFAULT_SETTINGS.hero,
      })
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return

    load().catch((error) => {
      console.error(error)
      toast(error.message)
    })
  }, [isAdmin, load])

  /* ==========================================================
     AUTH STATES
     ========================================================== */

  if (user === undefined) {
    return (
      <div
        className='wrap'
        style={{
          padding: 60,
        }}
      >
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Login toast={toast} msg={msg} />
  }

  if (!isAdmin) {
    return (
      <div
        className='wrap'
        style={{
          maxWidth: 480,
          padding: '56px 0',
        }}
      >
        <h2>No admin access</h2>

        <p
          className='note'
          style={{
            margin: '8px 0 18px',
          }}
        >
          {user.email} is signed in but is not an admin.
        </p>

        <p
          className='note'
          style={{
            marginBottom: 18,
          }}
        >
          Make sure this email has been added to the <code>admins</code> table
          in Supabase.
        </p>

        <button className='btn ghost' onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>
    )
  }

  /* ==========================================================
     ADMIN DASHBOARD
     ========================================================== */

  return (
    <div className='wrap'>
      <div className='tabs'>
        {[
          ['products', 'Products'],
          ['brands', 'Brands'],
          ['categories', 'Categories'],
          ['settings', 'Settings and hero'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`btn ${tab === key ? '' : 'ghost'}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}

        <span
          style={{
            flex: 1,
          }}
        />

        <button className='btn ghost' onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>

      {tab === 'products' && (
        <Products
          brands={brands}
          categories={categories}
          products={products}
          load={load}
          toast={toast}
        />
      )}

      {tab === 'brands' && (
        <Brands brands={brands} products={products} load={load} toast={toast} />
      )}

      {tab === 'categories' && (
        <Categories
          categories={categories}
          products={products}
          load={load}
          toast={toast}
        />
      )}

      {tab === 'settings' && <Settings s={s} setS={setS} toast={toast} />}

      <p
        className='note'
        style={{
          margin: '0 0 40px',
        }}
      >
        Changes go live on the public site within about a minute. Orders are
        stored in the Supabase <code>orders</code> table.
      </p>

      {msg && (
        <div className='toast' role='status'>
          {msg}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   LOGIN
   ============================================================ */

function Login({ toast, msg }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)

  const go = async (e) => {
    e.preventDefault()

    setBusy(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pw,
    })

    if (error) {
      toast('Wrong email or password.')
    }

    setBusy(false)
  }

  return (
    <div
      className='wrap'
      style={{
        maxWidth: 400,
        padding: '56px 0',
      }}
    >
      <h2>Admin sign in</h2>

      <form
        className='f'
        onSubmit={go}
        style={{
          marginTop: 18,
        }}
      >
        <label>
          Email
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete='username'
            required
          />
        </label>

        <label>
          Password
          <input
            type='password'
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete='current-password'
            required
          />
        </label>

        <button className='btn red' disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {msg && (
        <div className='toast' role='status'>
          {msg}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   PRODUCTS
   ============================================================ */

function Products({ brands, categories, products, load, toast }) {
  const [f, setF] = useState(EMPTY)

  const [eid, setEid] = useState(null)

  const [file, setFile] = useState(null)

  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value

    setF((current) => ({
      ...current,
      [key]: value,
    }))
  }

  /* ==========================================================
     SAVE PRODUCT
     ========================================================== */

  const save = async () => {
    const name = f.name.trim()

    if (!name) {
      return toast('Product name is required.')
    }

    if (!f.brand_id) {
      return toast('Choose a brand.')
    }

    if (!f.category_id) {
      return toast('Choose a category.')
    }

    if (f.price === '' || Number(f.price) < 0) {
      return toast('Enter a valid price.')
    }

    setBusy(true)

    try {
      const id = eid || slugify(name)

      const image = file ? await upload(file, 'products') : f.image

      const price = Number(f.price)

      const compareAt =
        f.compare_at_price === '' ? null : Number(f.compare_at_price)

      const stock = Math.max(0, Number(f.stock_quantity || 0))

      const lowStock = Math.max(0, Number(f.low_stock_threshold || 0))

      const row = {
        id,

        sku: f.sku.trim() || null,

        name,

        brand_id: f.brand_id,

        category_id: f.category_id,

        price,

        compare_at_price: compareAt,

        description: f.description.trim(),

        image: image || '',

        video: f.video.trim(),

        stock_quantity: stock,

        low_stock_threshold: lowStock,

        active: Boolean(f.active),

        featured: Boolean(f.featured),
      }

      const { error } = await supabase.from('products').upsert(row)

      if (error) {
        throw error
      }

      /* Keep inventory table synchronized */

      const { error: inventoryError } = await supabase
        .from('inventory')
        .upsert({
          product_id: id,
          quantity: stock,
          updated_at: new Date().toISOString(),
        })

      if (inventoryError) {
        throw inventoryError
      }

      setF(EMPTY)
      setEid(null)
      setFile(null)

      await load()

      toast('Product saved.')
    } catch (error) {
      console.error(error)
      toast(error.message)
    }

    setBusy(false)
  }

  /* ==========================================================
     EDIT
     ========================================================== */

  const edit = (p) => {
    setEid(p.id)

    setF({
      name: p.name || '',
      sku: p.sku || '',
      brand_id: p.brand_id || '',
      category_id: p.category_id || '',
      price: p.price !== null && p.price !== undefined ? String(p.price) : '',
      compare_at_price:
        p.compare_at_price !== null && p.compare_at_price !== undefined
          ? String(p.compare_at_price)
          : '',
      description: p.description || '',
      video: p.video || '',
      stock_quantity: String(p.stock_quantity || 0),
      low_stock_threshold: String(p.low_stock_threshold || 5),
      active: p.active !== false,
      featured: Boolean(p.featured),
      image: p.image || '',
    })

    setFile(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  /* ==========================================================
     DELETE
     ========================================================== */

  const del = async (p) => {
    if (!confirm(`Delete ${p.name}?`)) {
      return
    }

    const { error } = await supabase.from('products').delete().eq('id', p.id)

    if (error) {
      return toast(error.message)
    }

    await load()

    toast('Product deleted.')
  }

  /* ==========================================================
     SAMPLE PRODUCTS
     ========================================================== */

  const sample = async () => {
    setBusy(true)

    try {
      const brandRows = SAMPLE_BRANDS.map((name) => ({
        id: slugify(name),
        name,
      }))

      const { error: brandError } = await supabase
        .from('brands')
        .upsert(brandRows)

      if (brandError) {
        throw brandError
      }

      const { data: categoryRows, error: categoryError } = await supabase
        .from('categories')
        .select('*')

      if (categoryError) {
        throw categoryError
      }

      const defaultCategory =
        categoryRows.find((c) => c.id === 'power-tools') || categoryRows[0]

      if (!defaultCategory) {
        throw new Error('Create at least one category first.')
      }

      const rows = SAMPLE_PRODUCTS.map(({ inStock, brand, category, ...p }) => {
        const brandName = brand || SAMPLE_BRANDS[0]

        const categoryMatch = categoryRows.find(
          (c) => c.name.toLowerCase() === String(category || '').toLowerCase()
        )

        return {
          id: slugify(p.name),

          name: p.name,

          sku: p.sku || null,

          brand_id: slugify(brandName),

          category_id: categoryMatch?.id || defaultCategory.id,

          price: Number(p.price || 0),

          description: p.description || '',

          image: p.image || '',

          video: p.video || '',

          stock_quantity:
            inStock === false ? 0 : Number(p.stock_quantity || 10),

          low_stock_threshold: 5,

          active: true,

          featured: false,
        }
      })

      const { error } = await supabase.from('products').upsert(rows)

      if (error) {
        throw error
      }

      await load()

      toast('Sample products added.')
    } catch (error) {
      console.error(error)
      toast(error.message)
    }

    setBusy(false)
  }

  return (
    <>
      <div className='f'>
        <h3>{eid ? 'Edit product' : 'Add product'}</h3>

        <div className='f2'>
          <label>
            Name
            <input
              value={f.name}
              onChange={set('name')}
              placeholder='Deli Electric Sprayer'
            />
          </label>

          <label>
            SKU / Product Code
            <input
              value={f.sku}
              onChange={set('sku')}
              placeholder='EDL581120'
            />
          </label>

          <label>
            Brand
            <select value={f.brand_id} onChange={set('brand_id')}>
              <option value=''>Choose brand</option>

              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Category
            <select value={f.category_id} onChange={set('category_id')}>
              <option value=''>Choose category</option>

              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Price (KSh)
            <input
              type='number'
              min='0'
              step='0.01'
              value={f.price}
              onChange={set('price')}
            />
          </label>

          <label>
            Old / Compare-at Price
            <input
              type='number'
              min='0'
              step='0.01'
              value={f.compare_at_price}
              onChange={set('compare_at_price')}
              placeholder='Optional'
            />
          </label>

          <label>
            Stock Quantity
            <input
              type='number'
              min='0'
              value={f.stock_quantity}
              onChange={set('stock_quantity')}
            />
          </label>

          <label>
            Low Stock Alert
            <input
              type='number'
              min='0'
              value={f.low_stock_threshold}
              onChange={set('low_stock_threshold')}
            />
          </label>
        </div>

        <label>
          Description
          <textarea
            rows='3'
            value={f.description}
            onChange={set('description')}
          />
        </label>

        <label>
          Product Photo
          <input
            type='file'
            accept='image/jpeg,image/png,image/webp'
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        {f.image && !file && (
          <img
            src={f.image}
            alt=''
            style={{
              width: 100,
              height: 100,
              objectFit: 'contain',
            }}
          />
        )}

        <label>
          Product video URL
          <input
            type='url'
            value={f.video}
            onChange={set('video')}
            placeholder='https://.../demo.mp4'
          />
        </label>

        <div
          style={{
            display: 'flex',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <label
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              type='checkbox'
              checked={f.active}
              onChange={set('active')}
              style={{
                width: 'auto',
              }}
            />
            Active
          </label>

          <label
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <input
              type='checkbox'
              checked={f.featured}
              onChange={set('featured')}
              style={{
                width: 'auto',
              }}
            />
            Featured
          </label>
        </div>

        <div>
          <button className='btn red' disabled={busy} onClick={save}>
            {busy ? 'Saving…' : eid ? 'Save changes' : 'Add product'}
          </button>

          {eid && (
            <button
              className='btn ghost'
              onClick={() => {
                setEid(null)
                setF(EMPTY)
                setFile(null)
              }}
            >
              Cancel
            </button>
          )}

          {!products.length && (
            <button className='btn ghost' disabled={busy} onClick={sample}>
              Load sample products
            </button>
          )}
        </div>
      </div>

      <table className='tbl'>
        <tbody>
          {products.map((p) => {
            const brand = p.brands?.name || 'No brand'

            const category = p.categories?.name || 'No category'

            const low = p.stock_quantity <= p.low_stock_threshold

            return (
              <tr key={p.id}>
                <td>{p.image && <img src={p.image} alt='' />}</td>

                <td>
                  <b>{p.name}</b>

                  <br />

                  <small>
                    {p.sku ? `${p.sku} · ` : ''}
                    {brand}
                    {' · '}
                    {category}
                    {' · '}
                    {kes(p.price)}
                    {' · '}
                    Stock: {p.stock_quantity}
                    {!p.active && ' · inactive'}
                    {low && ' · low stock'}
                  </small>
                </td>

                <td
                  style={{
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <button className='btn ghost sm' onClick={() => edit(p)}>
                    Edit
                  </button>{' '}
                  <button className='btn danger sm' onClick={() => del(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

/* ============================================================
   BRANDS
   ============================================================ */

function Brands({ brands, products, load, toast }) {
  const [n, setN] = useState('')

  const add = async () => {
    const name = n.trim()

    const id = slugify(name)

    if (!id) {
      return toast('Enter a brand name.')
    }

    const { error } = await supabase.from('brands').upsert({
      id,
      name,
    })

    if (error) {
      return toast(error.message)
    }

    setN('')

    await load()

    toast('Brand added.')
  }

  const del = async (brand) => {
    const used = products.filter((p) => p.brand_id === brand.id).length

    if (used) {
      return toast(
        `Delete or move the ${used} product(s) under ${brand.name} first.`
      )
    }

    if (!confirm(`Delete ${brand.name}?`)) {
      return
    }

    const { error } = await supabase.from('brands').delete().eq('id', brand.id)

    if (error) {
      return toast(error.message)
    }

    await load()

    toast('Brand deleted.')
  }

  return (
    <>
      <div className='f'>
        <h3>Add brand</h3>

        <label>
          Brand name
          <input
            value={n}
            onChange={(e) => setN(e.target.value)}
            placeholder='Deli'
          />
        </label>

        <div>
          <button className='btn red' onClick={add}>
            Add brand
          </button>
        </div>
      </div>

      <table className='tbl'>
        <tbody>
          {brands.map((b) => (
            <tr key={b.id}>
              <td>
                <b>{b.name}</b>

                <br />

                <small>
                  {products.filter((p) => p.brand_id === b.id).length} products
                </small>
              </td>

              <td
                style={{
                  textAlign: 'right',
                }}
              >
                <button className='btn danger sm' onClick={() => del(b)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

/* ============================================================
   CATEGORIES
   ============================================================ */

function Categories({ categories, products, load, toast }) {
  const [n, setN] = useState('')

  const add = async () => {
    const name = n.trim()

    const id = slugify(name)

    if (!id) {
      return toast('Enter a category name.')
    }

    const { error } = await supabase.from('categories').upsert({
      id,
      name,
    })

    if (error) {
      return toast(error.message)
    }

    setN('')

    await load()

    toast('Category added.')
  }

  const del = async (category) => {
    const used = products.filter((p) => p.category_id === category.id).length

    if (used) {
      return toast(
        `Delete or move the ${used} product(s) under ${category.name} first.`
      )
    }

    if (!confirm(`Delete ${category.name}?`)) {
      return
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)

    if (error) {
      return toast(error.message)
    }

    await load()

    toast('Category deleted.')
  }

  return (
    <>
      <div className='f'>
        <h3>Add category</h3>

        <label>
          Category name
          <input
            value={n}
            onChange={(e) => setN(e.target.value)}
            placeholder='Power Tools'
          />
        </label>

        <div>
          <button className='btn red' onClick={add}>
            Add category
          </button>
        </div>
      </div>

      <table className='tbl'>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>
                <b>{category.name}</b>

                <br />

                <small>
                  {products.filter((p) => p.category_id === category.id).length}{' '}
                  products
                </small>
              </td>

              <td
                style={{
                  textAlign: 'right',
                }}
              >
                <button className='btn danger sm' onClick={() => del(category)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

/* ============================================================
   SETTINGS
   ============================================================ */

function Settings({ s, setS, toast }) {
  const [busy, setBusy] = useState(false)

  const up = (key) => (e) =>
    setS((current) => ({
      ...current,
      [key]: e.target.value,
    }))

  const slide = (index, patch) => {
    setS((current) => ({
      ...current,

      hero: current.hero.map((item, i) =>
        i === index
          ? {
              ...item,
              ...patch,
            }
          : item
      ),
    }))
  }

  const move = (index, direction) => {
    setS((current) => {
      const hero = [...current.hero]

      const target = index + direction

      if (target < 0 || target >= hero.length) {
        return current
      }

      ;[hero[index], hero[target]] = [hero[target], hero[index]]

      return {
        ...current,
        hero,
      }
    })
  }

  const save = async () => {
    setBusy(true)

    const { error } = await supabase.from('settings').upsert({
      id: 'store',
      data: s,
    })

    toast(error ? error.message : 'Settings saved.')

    setBusy(false)
  }

  const img = async (index, file) => {
    if (!file) return

    try {
      const image = await upload(file, 'hero')

      slide(index, {
        i: image,
      })

      toast('Image added. Click Save.')
    } catch (error) {
      toast(error.message)
    }
  }

  return (
    <>
      <div className='f'>
        <h3>Store settings</h3>

        <label>
          Store name
          <input value={s.name} onChange={up('name')} />
        </label>

        <label>
          WhatsApp number for orders
          <input value={s.wa} onChange={up('wa')} placeholder='2547XXXXXXXX' />
          <small>Country code, no + or spaces.</small>
        </label>

        <label>
          WhatsApp channel or group invite link
          <input
            value={s.ch}
            onChange={up('ch')}
            placeholder='https://whatsapp.com/channel/...'
          />
        </label>
      </div>

      <div className='f'>
        <h3>Hero</h3>

        <label>
          Eyebrow
          <input value={s.heroEyebrow} onChange={up('heroEyebrow')} />
        </label>

        <label>
          Headline
          <input value={s.heroTitle} onChange={up('heroTitle')} />
        </label>

        <label>
          Highlighted word
          <input value={s.heroAccent} onChange={up('heroAccent')} />
        </label>

        {s.hero.map((x, i) => (
          <div className='hero-edit' key={i}>
            <div className='hero-preview'>
              {x.i ? <img src={x.i} alt='' /> : <strong>{x.wm || x.n}</strong>}
            </div>

            <div className='hero-fields'>
              <label>
                Title
                <input
                  value={x.n || ''}
                  onChange={(e) =>
                    slide(i, {
                      n: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Small label
                <input
                  value={x.yr || ''}
                  onChange={(e) =>
                    slide(i, {
                      yr: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Category
                <input
                  value={x.cat || ''}
                  onChange={(e) =>
                    slide(i, {
                      cat: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Wordmark
                <textarea
                  rows='2'
                  value={x.wm || ''}
                  onChange={(e) =>
                    slide(i, {
                      wm: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Headline
                <input
                  value={x.t || ''}
                  onChange={(e) =>
                    slide(i, {
                      t: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Description
                <textarea
                  value={x.d || ''}
                  onChange={(e) =>
                    slide(i, {
                      d: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Logo / image
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) => img(i, e.target.files?.[0])}
                />
              </label>

              <div className='hero-actions'>
                <button className='btn sm' onClick={() => move(i, -1)}>
                  ↑
                </button>

                <button className='btn sm' onClick={() => move(i, 1)}>
                  ↓
                </button>

                <button
                  className='btn danger sm'
                  onClick={() => {
                    if (s.hero.length <= 1) {
                      return toast('Keep at least one slide.')
                    }

                    setS({
                      ...s,
                      hero: s.hero.filter((_, j) => j !== i),
                    })
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className='hero-actions'>
          <button
            className='btn ghost'
            onClick={() =>
              setS({
                ...s,

                hero: [
                  ...s.hero,

                  {
                    n: 'New slide',
                    yr: '',
                    wm: 'YOUR LOGO',
                    ac: '#e21d2d',
                    cat: 'Featured',
                    t: 'Your headline.',
                    d: 'Add your description here.',
                    i: '',
                  },
                ],
              })
            }
          >
            Add slide
          </button>

          <button className='btn red' disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save settings and hero'}
          </button>
        </div>
      </div>
    </>
  )
}
