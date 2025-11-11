import { useEffect, useMemo, useState } from 'react'

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [cart, setCart] = useState([])
  const [seeding, setSeeding] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [message, setMessage] = useState('')

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category))
    return ['All', ...Array.from(set)]
  }, [products])

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = cart.length > 0 ? 6 : 0
  const total = subtotal + shipping

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchProducts(params = {}) {
    try {
      setLoading(true)
      const url = new URL(`${baseUrl}/products`)
      const q = params.q ?? search
      const cat = params.category ?? category
      if (q) url.searchParams.set('q', q)
      if (cat && cat !== 'All') url.searchParams.set('category', cat)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      setProducts(data)
      setLoading(false)
    } catch (e) {
      setLoading(false)
      setProducts([])
      setMessage(e.message || 'Error loading products')
    }
  }

  async function seedDemo() {
    try {
      setSeeding(true)
      setMessage('')
      const res = await fetch(`${baseUrl}/seed`, { method: 'POST' })
      const data = await res.json()
      setMessage(data.message || 'Seeded demo products')
      await fetchProducts({})
    } catch (e) {
      setMessage('Failed to seed demo products')
    } finally {
      setSeeding(false)
    }
  }

  function addToCart(product, color, size) {
    setCart(prev => {
      const key = `${product.id}-${color || ''}-${size || ''}`
      const existing = prev.find(i => i.key === key)
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [
        ...prev,
        {
          key,
          product_id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          quantity: 1,
          color: color || null,
          size: size || null,
        }
      ]
    })
    setShowCart(true)
  }

  function updateQty(key, qty) {
    setCart(prev => prev.map(i => i.key === key ? { ...i, quantity: Math.max(1, qty) } : i))
  }

  function removeFromCart(key) {
    setCart(prev => prev.filter(i => i.key !== key))
  }

  async function checkout() {
    if (cart.length === 0) return
    try {
      setPlacingOrder(true)
      setMessage('')
      const items = cart.map(i => ({
        product_id: i.product_id,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        color: i.color,
        size: i.size,
        image: i.image,
      }))
      const payload = {
        items,
        subtotal: Number(subtotal.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        total: Number(total.toFixed(2)),
      }
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Order failed')
      const data = await res.json()
      setCart([])
      setShowCart(false)
      setMessage(`Order placed! ID: ${data.order_id}`)
    } catch (e) {
      setMessage(e.message || 'Failed to place order')
    } finally {
      setPlacingOrder(false)
    }
  }

  const filtered = products

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold">FS</span>
            <div>
              <h1 className="text-xl font-bold text-slate-800">FlameStyle</h1>
              <p className="text-xs text-slate-500 -mt-0.5">Modern clothing for every day</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-[2]">
            <div className="relative w-full">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProducts({ q: e.target.value })}
                placeholder="Search tees, jeans, hoodies..."
                className="w-full rounded-lg border border-slate-300 bg-white/70 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => fetchProducts({ q: search })}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >Search</button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCart(true)}
              className="relative rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              Cart
              {cart.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold text-white bg-rose-500 rounded-full w-5 h-5">{cart.length}</span>
              )}
            </button>
            <a href="/test" className="hidden sm:inline-block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">System Check</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-tr from-indigo-50 to-violet-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Elevate your everyday essentials</h2>
            <p className="mt-3 text-slate-600">Soft fabrics, clean lines, and all-day comfort. Built for motion, designed for style.</p>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={() => fetchProducts({ featured: true })} className="rounded-lg bg-slate-900 text-white px-5 py-2.5 text-sm hover:bg-slate-800">Shop Featured</button>
              <button onClick={seedDemo} disabled={seeding} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60">{seeding ? 'Seeding…' : 'Load Demo Products'}</button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl bg-cover bg-center shadow-lg" style={{backgroundImage:'url(https://images.unsplash.com/photo-1629380321590-3b3f75d66dec?ixid=M3w3OTkxMTl8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwcG90dGVyeSUyMGhhbmRtYWRlfGVufDB8MHx8fDE3NjI4MTk5MTl8MA&ixlib=rb-4.1.0&w=1600&auto=format&fit=crop&q=80)'}} />
            <div className="absolute -bottom-4 -left-4 bg-white shadow rounded-xl px-4 py-3 text-sm">
              Free shipping over $50
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex flex-wrap items-center gap-3">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => { setCategory(c === 'All' ? '' : c); fetchProducts({ category: c }) }}
              className={`px-4 py-2 rounded-full text-sm border ${((category || 'All') === c) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300 hover:bg-slate-50'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="text-center text-slate-600">Loading products…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-600">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} />
            ))}
          </div>
        )}

        {message && (
          <div className="mt-6 text-sm text-center text-slate-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">{message}</div>
        )}
      </main>

      {/* Cart Drawer */}
      <div className={`fixed inset-0 z-40 ${showCart ? '' : 'pointer-events-none'}`}>
        {/* overlay */}
        <div
          onClick={() => setShowCart(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${showCart ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* panel */}
        <div className={`absolute right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-xl transition-transform ${showCart ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Cart</h3>
            <button onClick={() => setShowCart(false)} className="text-slate-500 hover:text-slate-700">Close</button>
          </div>
          <div className="p-5 h-[calc(100%-180px)] overflow-auto">
            {cart.length === 0 ? (
              <p className="text-slate-600">Your cart is empty.</p>
            ) : (
              <ul className="space-y-4">
                {cart.map(item => (
                  <li key={item.key} className="flex gap-3">
                    <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{item.title}</div>
                      <div className="text-sm text-slate-600">${item.price.toFixed(2)} {item.color ? `• ${item.color}` : ''} {item.size ? `• ${item.size}` : ''}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <input type="number" min={1} value={item.quantity} onChange={(e) => updateQty(item.key, parseInt(e.target.value || '1', 10))} className="w-16 rounded border border-slate-300 px-2 py-1 text-sm" />
                        <button onClick={() => removeFromCart(item.key)} className="text-rose-600 text-sm hover:underline">Remove</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-5 border-t bg-slate-50">
            <div className="flex items-center justify-between text-sm mb-1"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex items-center justify-between text-sm mb-3"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
            <div className="flex items-center justify-between font-semibold text-slate-900 text-lg mb-4"><span>Total</span><span>${total.toFixed(2)}</span></div>
            <button onClick={checkout} disabled={placingOrder || cart.length === 0} className="w-full rounded-lg bg-indigo-600 text-white px-5 py-3 text-sm hover:bg-indigo-700 disabled:opacity-60">{placingOrder ? 'Placing order…' : 'Checkout'}</button>
          </div>
        </div>
      </div>

      <footer className="py-10 text-center text-sm text-slate-500">© {new Date().getFullYear()} FlameStyle. All rights reserved.</footer>
    </div>
  )
}

function ProductCard({ product, onAdd }) {
  const [color, setColor] = useState(product.colors?.[0] || '')
  const [size, setSize] = useState(product.sizes?.[0] || '')
  return (
    <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        <img src={product.image} alt={product.title} className="w-full h-48 object-cover" />
        {product.featured && (
          <span className="absolute top-3 left-3 text-xs bg-amber-500 text-white px-2 py-0.5 rounded">Featured</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 line-clamp-1">{product.title}</h3>
          {product.rating && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">★ {product.rating.toFixed(1)}</span>
          )}
        </div>
        <p className="text-sm text-slate-600 line-clamp-2 mt-1">{product.description}</p>
        <div className="mt-3 font-semibold text-slate-900">${product.price.toFixed(2)}</div>
        <div className="mt-3 flex items-center gap-2">
          {product.colors?.length > 0 && (
            <select value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm">
              {product.colors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {product.sizes?.length > 0 && (
            <select value={size} onChange={(e) => setSize(e.target.value)} className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm">
              {product.sizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
        <button
          onClick={() => onAdd(product, color, size)}
          className="mt-4 w-full rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
        >
          Add to cart
        </button>
      </div>
    </div>
  )
}

export default App
