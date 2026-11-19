import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Menu, Minus, Plus, Search, ShoppingBag, SlidersHorizontal, X } from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const previewProducts = [
  { id: 1, slug: 'aero-01', name: 'AERO 01', category: 'Running', description: 'Ligereza que sigue tu ritmo. Malla transpirable y amortiguación suave para ir más lejos.', price_cop: 329900, image: '/images/hero.png', color: 'Marfil / Terracota', sizes: [36,37,38,39,40,41,42,43], stock: 18 },
  { id: 2, slug: 'terra-knit', name: 'TERRA KNIT', category: 'Lifestyle', description: 'Una silueta esencial para cada día. Tejido flexible y comodidad sin esfuerzo.', price_cop: 289900, image: '/images/black.png', color: 'Grafito / Hueso', sizes: [36,37,38,39,40,41,42,43], stock: 24 },
  { id: 3, slug: 'pulse-trail', name: 'PULSE TRAIL', category: 'Training', description: 'Presencia y rendimiento en cada paso. Tracción firme y energía vibrante.', price_cop: 349900, image: '/images/orange.png', color: 'Óxido / Crema', sizes: [37,38,39,40,41,42,43], stock: 15 },
]
const categories = ['Todos', 'Running', 'Lifestyle', 'Training']
const money = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)

function readCart() {
  try { return JSON.parse(localStorage.getItem('stride-cart') || '[]') } catch { return [] }
}

export default function App() {
  const [products, setProducts] = useState(previewProducts)
  const [apiReady, setApiReady] = useState(false)
  const [category, setCategory] = useState('Todos')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [selected, setSelected] = useState(null)
  const [size, setSize] = useState(null)
  const [cart, setCart] = useState(readCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkout, setCheckout] = useState(false)
  const [customer, setCustomer] = useState({ customer_name: '', customer_email: '' })
  const [busy, setBusy] = useState(false)
  const [order, setOrder] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/products`).then(response => {
      if (!response.ok) throw new Error('API no disponible')
      return response.json()
    }).then(data => { setProducts(data.products); setApiReady(true) }).catch(() => setApiReady(false))
  }, [])
  useEffect(() => { localStorage.setItem('stride-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => {
    document.body.style.overflow = (cartOpen || selected || order) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [cartOpen, selected, order])

  const filtered = useMemo(() => products.filter(product =>
    (category === 'Todos' || product.category === category) &&
    product.name.toLowerCase().includes(query.toLowerCase().trim())
  ), [products, category, query])
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.product.price_cop * item.quantity, 0)

  function openProduct(product) { setSelected(product); setSize(null) }
  function addToCart() {
    if (!size) { setNotice('Selecciona una talla para continuar.'); return }
    const key = `${selected.id}-${size}`
    setCart(current => {
      const existing = current.find(item => item.key === key)
      if (existing) return current.map(item => item.key === key ? { ...item, quantity: Math.min(item.quantity + 1, 10) } : item)
      return [...current, { key, product: selected, size, quantity: 1 }]
    })
    setSelected(null); setCartOpen(true); setNotice('')
  }
  function changeQuantity(key, delta) {
    setCart(current => current.map(item => item.key === key ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0))
  }
  async function submitOrder(event) {
    event.preventDefault()
    if (!apiReady) { setNotice('Conecta la API para enviar pedidos. El catálogo está en modo demostración.'); return }
    setBusy(true); setNotice('')
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...customer, items: cart.map(item => ({ product_id: item.product.id, size: item.size, quantity: item.quantity })) })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo registrar el pedido')
      setOrder(data.order); setCart([]); setCartOpen(false); setCheckout(false)
      setCustomer({ customer_name: '', customer_email: '' })
      fetch(`${API_URL}/api/products`).then(r => r.json()).then(d => setProducts(d.products)).catch(() => {})
    } catch (error) { setNotice(error.message) }
    finally { setBusy(false) }
  }

  return <>
    <div className="announcement">ENVÍO GRATIS EN PEDIDOS DE $300.000 <span>·</span> NUEVA COLECCIÓN 2026</div>
    <header className="site-header">
      <a className="brand" href="#inicio" aria-label="STRIDE inicio">STRIDE<span className="brand-dot">.</span></a>
      <nav className={mobileMenu ? 'navigation open' : 'navigation'} aria-label="Navegación principal">
        <a href="#coleccion" onClick={() => setMobileMenu(false)}>Colección</a>
        <a href="#historia" onClick={() => setMobileMenu(false)}>Nuestra historia</a>
        <a href="#contacto" onClick={() => setMobileMenu(false)}>Contacto</a>
      </nav>
      <div className="header-actions">
        <button className="icon-button" aria-label="Buscar productos" onClick={() => { setSearchOpen(!searchOpen); document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' }) }}><Search size={20}/></button>
        <button className="icon-button bag-button" aria-label={`Abrir carrito, ${count} artículos`} onClick={() => setCartOpen(true)}><ShoppingBag size={20}/>{count > 0 && <span className="bag-count">{count}</span>}</button>
        <button className="icon-button mobile-toggle" aria-label="Abrir menú" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
    </header>

    <main>
      <section className="hero" id="inicio">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-content">
          <span className="eyebrow">MOVIMIENTO SIN LÍMITES / 001</span>
          <h1>HECHOS PARA<br/><em>SEGUIRTE.</em></h1>
          <p>Diseño que se mueve contigo. Descubre tenis creados para todos tus caminos.</p>
          <a href="#coleccion" className="primary-button">Explorar colección <ArrowUpRight size={18}/></a>
        </div>
        <div className="hero-bottom"><span>STRIDE / COLOMBIA</span><span>DESLIZA PARA DESCUBRIR ↓</span></div>
      </section>

      <section className="intro-strip" aria-label="Manifiesto">
        <span>01 / TODOS LOS DÍAS</span>
        <p>Tu siguiente paso empieza aquí.</p>
        <span>DISEÑADOS PARA MOVERTE ↗</span>
      </section>

      <section className="collection section-wrap" id="coleccion">
        <div className="section-heading"><div><span className="eyebrow">LA COLECCIÓN</span><h2>Encuentra tu ritmo<span>.</span></h2></div><p>Movimiento, estilo y comodidad para cada versión de ti.</p></div>
        <div className="catalog-tools">
          <div className="category-tabs" role="group" aria-label="Filtrar por categoría">{categories.map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <button className="filter-label" onClick={() => setSearchOpen(!searchOpen)}><SlidersHorizontal size={17}/> Buscar / Filtrar</button>
        </div>
        {searchOpen && <div className="search-row"><Search size={19}/><input autoFocus placeholder="Busca tu próximo par..." value={query} onChange={event => setQuery(event.target.value)} aria-label="Buscar por nombre"/><button onClick={() => { setQuery(''); setSearchOpen(false) }} aria-label="Cerrar búsqueda"><X size={18}/></button></div>}
        <div className="product-grid">{filtered.map((product, index) => <article className="product" key={product.id}>
          <button className="product-image" onClick={() => openProduct(product)} aria-label={`Ver ${product.name}`}><img src={product.image} alt={`Tenis ${product.name} en color ${product.color}`}/><span className="product-index">0{index + 1}</span><span className="product-view">VER PRODUCTO <ArrowUpRight size={18}/></span></button>
          <div className="product-meta"><div><span>{product.category.toUpperCase()}</span><h3>{product.name}</h3><small>{product.color}</small></div><strong>{money(product.price_cop)}</strong></div>
        </article>)}</div>
        {filtered.length === 0 && <div className="empty-results">No encontramos tenis con ese nombre. Prueba otra búsqueda.</div>}
      </section>

      <section className="editorial" id="historia"><div className="editorial-photo"><img src="/images/orange.png" alt="Tenis STRIDE Pulse Trail en color terracota"/></div><div className="editorial-copy"><span className="eyebrow">HECHOS PARA EL CAMINO</span><h2>UN PASO<br/>MÁS ALLÁ<span>.</span></h2><p>Creemos que moverse cambia la forma de ver el mundo. Por eso diseñamos pares que se sienten tan bien como se ven.</p><a href="#coleccion" className="text-link">Conoce la colección <ArrowRight size={19}/></a><span className="editorial-number">STRIDE / 02</span></div></section>

      <section className="final-banner"><span className="eyebrow">LISTO PARA MOVERTE</span><h2>Tu camino.<br/><i>Tu ritmo.</i></h2><a href="#coleccion" className="light-button">Elegir mis tenis <ArrowUpRight size={18}/></a></section>
    </main>
    <footer id="contacto"><div className="footer-top"><span className="footer-brand">STRIDE<span>.</span></span><p>El movimiento empieza contigo.</p></div><div className="footer-bottom"><span>© 2026 STRIDE. PROYECTO ACADÉMICO.</span><span>DISEÑADO PARA SEGUIR ADELANTE.</span><a href="mailto:hola@stride.example">CONTACTO ↗</a></div></footer>

    {selected && <div className="overlay" onMouseDown={() => setSelected(null)}><div className="product-dialog" role="dialog" aria-modal="true" aria-label={selected.name} onMouseDown={event => event.stopPropagation()}><button className="close-dialog" onClick={() => setSelected(null)} aria-label="Cerrar"><X/></button><div className="dialog-image"><img src={selected.image} alt={selected.name}/></div><div className="dialog-copy"><span className="eyebrow">STRIDE / {selected.category.toUpperCase()}</span><h2>{selected.name}</h2><p>{selected.description}</p><div className="dialog-price">{money(selected.price_cop)}</div><div className="size-title"><span>Selecciona tu talla</span><small>EU</small></div><div className="sizes">{selected.sizes.map(item => <button className={size === item ? 'selected' : ''} onClick={() => { setSize(item); setNotice('') }} key={item}>{item}</button>)}</div><p className="stock-note">{selected.stock > 0 ? `${selected.stock} pares disponibles` : 'Agotado'}</p>{notice && <p className="notice">{notice}</p>}<button className="dark-button" disabled={selected.stock === 0} onClick={addToCart}>Agregar al carrito <ShoppingBag size={19}/></button></div></div></div>}

    {cartOpen && <div className="overlay" onMouseDown={() => { setCartOpen(false); setCheckout(false); setNotice('') }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Carrito" onMouseDown={event => event.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">TU SELECCIÓN</span><h2>{checkout ? 'Finalizar pedido' : 'Carrito'} <sup>{count}</sup></h2></div><button aria-label="Cerrar carrito" onClick={() => { setCartOpen(false); setCheckout(false); setNotice('') }}><X/></button></div>
      {checkout ? <form className="checkout-form" onSubmit={submitOrder}><button type="button" className="back-link" onClick={() => setCheckout(false)}><ChevronLeft size={18}/> Volver al carrito</button><p>Déjanos tus datos para registrar tu pedido de demostración.</p><label>Nombre completo<input required minLength="2" maxLength="120" value={customer.customer_name} onChange={e => setCustomer({ ...customer, customer_name: e.target.value })} placeholder="Tu nombre"/></label><label>Correo electrónico<input required type="email" value={customer.customer_email} onChange={e => setCustomer({ ...customer, customer_email: e.target.value })} placeholder="tu@correo.com"/></label><div className="checkout-total"><span>Total</span><strong>{money(subtotal)}</strong></div>{notice && <p className="notice">{notice}</p>}<button className="dark-button" disabled={busy}>{busy ? 'Registrando...' : 'Confirmar pedido'} <ArrowRight size={18}/></button><small>No se realiza ningún cobro. Proyecto académico.</small></form> : <><div className="cart-items">{cart.length === 0 ? <div className="cart-empty"><ShoppingBag size={42} strokeWidth={1}/><h3>Tu carrito está esperando.</h3><p>Encuentra tu próximo par favorito.</p><button className="text-link" onClick={() => setCartOpen(false)}>Explorar colección <ChevronRight size={18}/></button></div> : cart.map(item => <div className="cart-item" key={item.key}><img src={item.product.image} alt={item.product.name}/><div className="cart-item-info"><span>{item.product.category.toUpperCase()}</span><h3>{item.product.name}</h3><small>Talla {item.size}</small><div className="quantity"><button aria-label="Quitar una unidad" onClick={() => changeQuantity(item.key, -1)}><Minus size={14}/></button><span>{item.quantity}</span><button aria-label="Agregar una unidad" disabled={item.quantity >= 10} onClick={() => changeQuantity(item.key, 1)}><Plus size={14}/></button></div></div><strong>{money(item.product.price_cop * item.quantity)}</strong></div>)}</div>{cart.length > 0 && <div className="cart-footer"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><small>Envío calculado al confirmar el pedido.</small><button className="dark-button" onClick={() => { setCheckout(true); setNotice('') }}>Continuar <ArrowRight size={18}/></button></div>}</>}
    </aside></div>}
    {order && <div className="overlay"><div className="order-success" role="dialog" aria-modal="true"><div className="success-icon"><Check size={34}/></div><span className="eyebrow">PEDIDO REGISTRADO</span><h2>¡Gracias por moverte con nosotros!</h2><p>Recibimos tu pedido de demostración <strong>#{order.code}</strong> por {money(order.total_cop)}.</p><button className="dark-button" onClick={() => setOrder(null)}>Seguir explorando <ArrowRight size={18}/></button></div></div>}
  </>
}

