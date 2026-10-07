import { cache } from 'react';
import { supabase } from './supabase';
import { DEFAULT_SETTINGS } from './util';

const toProduct = (r) => ({
  id: r.id, name: r.name, brand: r.brand, category: r.category, price: Number(r.price),
  description: r.description, image: r.image, video: r.video, inStock: r.in_stock, _t: Date.parse(r.created_at) || 0,
});

export const getSettings = cache(async () => {
  const { data, error } = await supabase.from('settings').select('data').eq('id', 'store').maybeSingle();
  const d = !error && data?.data ? data.data : {};
  return { ...DEFAULT_SETTINGS, ...d, hero: d.hero?.length ? d.hero : DEFAULT_SETTINGS.hero };
});

export const getBrands = cache(async () => {
  const { data, error } = await supabase.from('brands').select('id,name').order('name');
  return error ? [] : data;
});

export const getProducts = cache(async () => {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  return error ? [] : data.map(toProduct);
});

export const getProduct = cache(async (slug) => {
  const { data, error } = await supabase.from('products').select('*').eq('id', slug).maybeSingle();
  return error || !data ? null : toProduct(data);
});
