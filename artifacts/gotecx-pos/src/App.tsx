import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bell, Box, Check, ChevronDown,
  CircleDollarSign, ClipboardList, CreditCard, FileText, Gauge, Globe2, Home, Menu,
  Package, Plus, Search, Settings, ShoppingBag, ShoppingCart, Tag, Users, Wallet, X,
} from 'lucide-react';

type Product = { id:string; name:string; sku:string; category:string; price:number; currency:'LRD'|'USD'; stock:number; lowStockThreshold:number; active:boolean };
type Customer = { id:string; name:string; phone:string; email:string; county:string; notes:string };
type SaleItem = { productId:string; name:string; quantity:number; unitPrice:number };
type Order = { id:string; createdAt:string; customerId:string|null; items:SaleItem[]; subtotal:number; discount:number; total:number; currency:'LRD'|'USD'; paymentMethod:string; status:'completed'|'refunded' };
type Discount = { id:string; name:string; code:string; type:'percent'|'fixed'; value:number; active:boolean; startsAt:string; endsAt:string };
type TeamMember = { id:string; name:string; email:string; role:'owner'|'manager'|'cashier' };
type Business = { id:string; name:string; category:string; country:'Liberia'; county:string; city:string; currency:'LRD'|'USD'; timezone:'Africa/Monrovia' };
type Store = { business:Business; user:TeamMember; products:Product[]; customers:Customer[]; orders:Order[]; discounts:Discount[]; team:TeamMember[]; settings:Record<string,string> };
type OpenForm = (title:string, fields:{key:string;label:string;type?:string;options?:string[];required?:boolean;defaultValue?:string|number}[], initial:Record<string,any>, onSave:(values:Record<string,any>)=>void, subtitle?:string)=>void;

const counties = ['Bomi','Bong','Gbarpolu','Grand Bassa','Grand Cape Mount','Grand Gedeh','Grand Kru','Lofa','Margibi','Maryland','Montserrado','Nimba','River Cess','River Gee','Sinoe'];
const navMain = [
  ['Home', '/home', Home], ['Orders','/orders',ClipboardList], ['Products','/products',Package], ['Customers','/customers',Users],
  ['Growth','/growth',Activity], ['Discounts','/discounts',Tag], ['Content','/content',FileText], ['Markets','/markets',Globe2],
  ['Finance','/finance',Wallet], ['Analytics','/analytics',BarChart3], ['Team','/team',Users],
];
const settingsItems = ['General','Plan','Billing','Users','Payments','Checkout','Customer accounts','Shipping and delivery','Taxes and duties','Locations','Markets','Apps','Sales channels','Domains','Notifications'];
const demoProducts:Product[] = [
  {id:'p1',name:'Liberian Coffee · 250g',sku:'COF-025',category:'Pantry',price:1150,currency:'LRD',stock:23,lowStockThreshold:6,active:true},
  {id:'p2',name:'Palm Butter · 500ml',sku:'PAN-014',category:'Pantry',price:780,currency:'LRD',stock:16,lowStockThreshold:5,active:true},
  {id:'p3',name:'Handwoven Market Tote',sku:'CRA-008',category:'Handmade',price:2400,currency:'LRD',stock:8,lowStockThreshold:3,active:true},
  {id:'p4',name:'Cassava Flour · 1kg',sku:'PAN-031',category:'Pantry',price:520,currency:'LRD',stock:31,lowStockThreshold:8,active:true},
  {id:'p5',name:'Kola Nut Soap',sku:'BEA-011',category:'Personal care',price:450,currency:'LRD',stock:4,lowStockThreshold:5,active:true},
  {id:'p6',name:'Coconut Oil · 250ml',sku:'BEA-016',category:'Personal care',price:960,currency:'LRD',stock:12,lowStockThreshold:4,active:true},
];
const seedOrders:Order[] = [
  {id:'GC-1042',createdAt:new Date(Date.now()-3600000*2).toISOString(),customerId:'c1',items:[{productId:'p1',name:'Liberian Coffee · 250g',quantity:2,unitPrice:1150}],subtotal:2300,discount:0,total:2300,currency:'LRD',paymentMethod:'mobile-money',status:'completed'},
  {id:'GC-1041',createdAt:new Date(Date.now()-3600000*7).toISOString(),customerId:'c2',items:[{productId:'p3',name:'Handwoven Market Tote',quantity:1,unitPrice:2400},{productId:'p4',name:'Cassava Flour · 1kg',quantity:2,unitPrice:520}],subtotal:3440,discount:0,total:3440,currency:'LRD',paymentMethod:'cash',status:'completed'},
  {id:'GC-1040',createdAt:new Date(Date.now()-86400000).toISOString(),customerId:null,items:[{productId:'p2',name:'Palm Butter · 500ml',quantity:1,unitPrice:780}],subtotal:780,discount:0,total:780,currency:'LRD',paymentMethod:'cash',status:'completed'},
];
const readStore = ():Store|null => { try { return JSON.parse(localStorage.getItem('gotecx-demo-store')||'null'); } catch { return null; } };
const money = (n:number,currency:string) => new Intl.NumberFormat('en-LR',{style:'currency',currency,maximumFractionDigits:currency==='LRD'?0:2}).format(n);
const initials = (name:string) => name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'G';
const id = () => Math.random().toString(36).slice(2,9);
const dateText = (d:string) => new Intl.DateTimeFormat('en-LR',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(d));

function App() {
  const [path, setPath] = useLocation();
  const [store,setStore] = useState<Store|null>(()=>readStore());
  const [search,setSearch] = useState('');
  const [toast,setToast] = useState('');
  const [modal,setModal] = useState<{title:string;subtitle?:string;content:ReactNode}|null>(null);
  const [settingsTab,setSettingsTab] = useState('General');
  const [period,setPeriod] = useState('7 days');
  const [mobileNav,setMobileNav] = useState(false);
  useEffect(()=>{ if(store) localStorage.setItem('gotecx-demo-store',JSON.stringify(store)); else localStorage.removeItem('gotecx-demo-store'); },[store]);
  useEffect(()=>{ if(toast){const t=setTimeout(()=>setToast(''),2800);return()=>clearTimeout(t);} return undefined; },[toast]);
  useEffect(()=>{ if(store && (path==='/'||path==='/login'||path==='/register')) setPath('/home'); if(!store && !['/login','/register'].includes(path)) setPath('/login'); },[store,path,setPath]);
  const update = (key:keyof Store, value:unknown) => setStore(s=>s?({...s,[key]:value} as Store):s);
  const notify = (message:string)=>setToast(message);
  const logout = ()=>{setStore(null);setPath('/login');setToast('Signed out of this browser.');};
  const openForm = (title:string, fields:{key:string;label:string;type?:string;options?:string[];required?:boolean;defaultValue?:string|number}[], initial:Record<string,any>, onSave:(values:Record<string,any>)=>void, subtitle?:string) => {
    const Form=()=>{const [values,setValues]=useState<Record<string,any>>({...initial}); const submit=(e:FormEvent)=>{e.preventDefault();onSave(values);setModal(null);};
      return <form onSubmit={submit}><div className="form-grid">{fields.map(f=><div className={`field ${f.type==='textarea'?'wide':''}`} key={f.key}><label>{f.label}</label>{f.type==='select'?<select value={values[f.key]??''} onChange={e=>setValues({...values,[f.key]:e.target.value})}>{(f.options||[]).map(x=><option key={x}>{x}</option>)}</select>:f.type==='textarea'?<textarea required={f.required} value={values[f.key]??''} onChange={e=>setValues({...values,[f.key]:e.target.value})}/>:<input required={f.required} type={f.type||'text'} value={values[f.key]??''} onChange={e=>setValues({...values,[f.key]:e.target.value})}/>}</div>)}</div><div className="dialog-actions"><button type="button" className="button" onClick={()=>setModal(null)}>Cancel</button><button className="button primary" type="submit">Save changes</button></div></form>; };
    setModal({title,subtitle,content:<Form/>});
  };
  const confirmDelete=(label:string,onDelete:()=>void)=>setModal({title:`Delete ${label}?`,subtitle:'This action cannot be undone.',content:<div><p style={{fontSize:13,color:'#68716c'}}>This item will be removed from your local demo workspace.</p><div className="dialog-actions"><button className="button" onClick={()=>setModal(null)}>Keep it</button><button className="button danger" onClick={()=>{onDelete();setModal(null);notify(`${label} deleted.`)}}>Delete</button></div></div>});

  if(!store) return <AuthPage path={path} setPath={setPath} setStore={setStore} notify={notify}/>;
  const pageName=path==='/settings'? 'Settings' : (navMain.find(x=>x[1]===path)?.[0] as string)||'Home';
  return <div className="app-frame">
    <aside className={`sidebar ${mobileNav?'mobile-show':''}`}>
      <div className="brand"><div className="brand-mark">G</div> gotecx<span style={{fontWeight:400,color:'#8e9994'}}>POS</span></div>
      <div className="nav-group">{navMain.map(([label,href,Icon])=><Link href={href as string} className={`nav-link ${path===href?'active':''}`} key={href as string} onClick={()=>setMobileNav(false)}><Icon size={16}/><span>{label as string}</span></Link>)}</div>
      <div className="nav-caption">Sales channels</div><Link href="/content" className={`nav-link ${path==='/content'?'active':''}`}><ShoppingBag size={16}/>Online storefront</Link>
      <div className="side-bottom"><Link href="/settings" className={`nav-link ${path==='/settings'?'active':''}`}><Settings size={16}/>Settings</Link>
        <button className="nav-link" style={{width:'100%',border:0,background:'transparent',textAlign:'left'}} onClick={logout}><div className="avatar">{initials(store.business.name)}</div><span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>{store.business.name}</span><ChevronDown size={14}/></button>
      </div>
    </aside>
    <main className="workspace">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={()=>setMobileNav(!mobileNav)} aria-label="Toggle navigation">{mobileNav?<X size={19}/>:<Menu size={19}/>}</button><div className="searchbar"><Search size={14}/><input placeholder="Search your store" value={search} onChange={e=>setSearch(e.target.value)}/><span style={{fontSize:10,color:'#939995'}}>⌘ K</span></div></div><div style={{display:'flex',alignItems:'center',gap:16}}><span className="muted" style={{fontSize:11}}><Globe2 size={14} style={{verticalAlign:'middle',marginRight:5}}/>Monrovia · {store.business.currency}</span><button className="button small" onClick={()=>notify('You are all caught up.') } aria-label="Notifications"><Bell size={14}/></button><div className="avatar">{initials(store.user.name)}</div></div></header>
      <section className="content">
        {path==='/home'&&<Dashboard store={store} setPath={setPath} notify={notify}/>}
        {path==='/products'&&<Products store={store} update={update} search={search} openForm={openForm} confirmDelete={confirmDelete} notify={notify}/>}
        {path==='/customers'&&<Customers store={store} update={update} search={search} openForm={openForm} confirmDelete={confirmDelete}/>}
        {path==='/orders'&&<Orders store={store} update={update} search={search} openForm={openForm} notify={notify}/>}
        {path==='/discounts'&&<Discounts store={store} update={update} search={search} openForm={openForm} confirmDelete={confirmDelete}/>}
        {path==='/analytics'&&<Analytics store={store} period={period} setPeriod={setPeriod}/>}
        {path==='/finance'&&<Finance store={store}/>}
        {path==='/team'&&<Team store={store} update={update} openForm={openForm} confirmDelete={confirmDelete}/>}
        {path==='/markets'&&<Markets store={store} update={update} openForm={openForm} notify={notify}/>}
        {path==='/growth'&&<Growth setPath={setPath} store={store}/>}
        {path==='/content'&&<Content setPath={setPath} store={store} notify={notify}/>}
        {path==='/settings'&&<SettingsPage store={store} update={update} tab={settingsTab} setTab={setSettingsTab} notify={notify}/>}
      </section>
      <div style={{padding:'0 36px 20px',fontSize:10,color:'#919895'}}>Demo workspace · Data is stored only in this browser and is not secure or shared across devices.</div>
    </main>
    {modal&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><div className="dialog"><div className="dialog-head"><div><h2>{modal.title}</h2>{modal.subtitle&&<p>{modal.subtitle}</p>}</div><button className="button small" onClick={()=>setModal(null)} aria-label="Close"><X size={15}/></button></div>{modal.content}</div></div>}
    {toast&&<div className="toast">{toast}</div>}
  </div>;
}

function AuthPage({path,setPath,setStore,notify}:{path:string;setPath:(p:string)=>void;setStore:(s:Store)=>void;notify:(s:string)=>void}) {
  const register=path==='/register';
  const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const fd=new FormData(e.currentTarget);const email=String(fd.get('email')||'');const name=String(fd.get('name')||email.split('@')[0]||'Shop owner');const businessName=register?String(fd.get('business')||''):'My demo shop';const business:Business={id:id(),name:businessName,category:String(fd.get('category')||'Retail'),country:'Liberia',county:String(fd.get('county')||'Montserrado'),city:String(fd.get('city')||'Monrovia'),currency:'LRD',timezone:'Africa/Monrovia'};
    const user:TeamMember={id:id(),name,email,role:'owner'};
    const store:Store={business,user,products:register?demoProducts:[],customers:register?[{id:'c1',name:'Massa K. Johnson',phone:'+231 77 234 9182',email:'massa@example.com',county:'Montserrado',notes:'Regular customer'},{id:'c2',name:'Samuel Toe',phone:'+231 88 510 2731',email:'',county:'Margibi',notes:''}]:[],orders:register?seedOrders:[],discounts:[],team:[user],settings:{}};setStore(store);setPath('/home');notify(register?'Your Liberia store is ready.':'Welcome back to your demo workspace.');};
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">G</div>
          <span>Gotecx<span className="brand-product">POS</span></span>
        </div>
        <div className="auth-form">
          <h2>{register ? 'Create your store' : 'Sign in to GotecxPOS'}</h2>
          <p>{register ? 'Set up your business in Liberia.' : 'Sign in to your business workspace.'}</p>
          <form onSubmit={submit}>
            {register && (
              <>
                <div className="field">
                  <label>Your name</label>
                  <input name="name" required placeholder="e.g. Josephine Doe" />
                </div>
                <div className="field">
                  <label>Business name</label>
                  <input name="business" required placeholder="e.g. Waterside Market Shop" />
                </div>
                <div className="field">
                  <label>Business type</label>
                  <select name="category">
                    <option>Retail</option>
                    <option>Food & beverage</option>
                    <option>Beauty & personal care</option>
                    <option>Professional services</option>
                    <option>Handmade goods</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label>County</label>
                    <select name="county">
                      {counties.map((county) => <option key={county}>{county}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>City / town</label>
                    <input name="city" defaultValue="Monrovia" />
                  </div>
                </div>
              </>
            )}
            <div className="field">
              <label>Email address</label>
              <input type="email" name="email" required placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="field">
              <label>{register ? 'Choose a demo password' : 'Password'}</label>
              <input
                type="password"
                name="password"
                required
                placeholder="At least 8 characters"
                autoComplete={register ? 'new-password' : 'current-password'}
              />
            </div>
            <button className="button primary auth-submit" type="submit">
              {register ? 'Create local workspace' : 'Sign in'}
            </button>
          </form>
          <div className="auth-switch">
            {register ? 'Already have a workspace?' : 'New to Gotecx?'}{' '}
            <a
              href={register ? '/login' : '/register'}
              onClick={(event) => {
                event.preventDefault();
                setPath(register ? '/login' : '/register');
              }}
            >
              {register ? 'Sign in' : 'Create your store'}
            </a>
          </div>
          <div className="notice">
            Demo only. Passwords are never stored or verified. Your workspace data stays in this browser’s local storage and is not secure or shared across devices.
          </div>
        </div>
      </section>
    </main>
  );
}

function PageHead({title,subtitle,action}:{title:string;subtitle:string;action?:ReactNode}) {return <div className="page-head"><div><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div>{action}</div>}
function Stat({label,value,note,icon:Icon}:{label:string;value:string;note:string;icon:any}) {return <div className="panel stat-card"><div className="stat-label">{label}</div><div className="stat-accent"><Icon size={16}/></div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>}
function Dashboard({store,setPath,notify}:{store:Store;setPath:(p:string)=>void;notify:(s:string)=>void}) {
  const revenue=store.orders.filter(o=>o.status==='completed').reduce((s,o)=>s+o.total,0), low=store.products.filter(p=>p.stock<=p.lowStockThreshold).length;
  const last=store.orders.slice(0,5);
  return <><PageHead title="Home" subtitle={`Good day, ${store.user.name.split(' ')[0]}. Here is your business at a glance.`} action={<button className="button primary" onClick={()=>setPath('/orders')}><Plus size={15}/> Create sale</button>}/>
    <div className="stat-grid"><Stat label="Total sales" value={money(revenue,store.business.currency)} note="Across completed demo orders" icon={CircleDollarSign}/><Stat label="Orders" value={String(store.orders.length)} note="All recorded transactions" icon={ShoppingCart}/><Stat label="Products" value={String(store.products.length)} note={`${low} need a stock check`} icon={Box}/><Stat label="Customers" value={String(store.customers.length)} note="In your customer list" icon={Users}/></div>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.55fr) minmax(260px,.85fr)',gap:16,marginBottom:18}}><div className="panel"><div className="panel-head"><h3 className="panel-title">Recent orders</h3><button className="button small" onClick={()=>setPath('/orders')}>View all</button></div><div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{last.map(o=><tr key={o.id}><td className="table-primary">#{o.id}</td><td>{store.customers.find(c=>c.id===o.customerId)?.name||'Walk-in'}</td><td>{dateText(o.createdAt)}</td><td>{money(o.total,o.currency)}</td><td><span className="badge">{o.status}</span></td></tr>)}</tbody></table></div>{!last.length&&<Empty title="No orders yet" text="Create your first sale to see activity here." action="Start a sale" onClick={()=>setPath('/orders')}/>}</div>
      <div className="panel"><div className="panel-head"><h3 className="panel-title">Stock to watch</h3><button className="button small" onClick={()=>setPath('/products')}>Manage</button></div><div className="panel-body">{store.products.filter(p=>p.stock<=p.lowStockThreshold).slice(0,4).map(p=><div className="cart-row" key={p.id}><div><strong style={{display:'block',fontSize:12}}>{p.name}</strong><span className="muted">{p.sku}</span></div><span className="badge amber">{p.stock} left</span></div>)}{!low&&<div className="callout">Everything is above its low-stock threshold. Nice work.</div>}</div></div></div>
    <div className="panel"><div className="panel-head"><h3 className="panel-title">Shortcuts</h3><span className="muted" style={{fontSize:11}}>Keep the day moving</span></div><div className="panel-body" style={{display:'flex',flexWrap:'wrap',gap:10}}>{[['New sale','/orders',ShoppingCart],['Add product','/products',Package],['Add customer','/customers',Users],['View analytics','/analytics',BarChart3]].map(([x,p,I]:any)=><button className="button" key={x} onClick={()=>p==='/products'?setPath('/products'):p==='/customers'?setPath('/customers'):setPath(p)}><I size={14}/>{x}</button>)}</div></div>
  </>;
}
function Empty({title,text,action,onClick}:{title:string;text:string;action?:string;onClick?:()=>void}) {return <div className="empty-state"><div className="empty-state-mark"><ShoppingBag size={21}/></div><h3>{title}</h3><p>{text}</p>{action&&<button className="button primary" onClick={onClick}><Plus size={14}/>{action}</button>}</div>}

const productFields=[{key:'name',label:'Product name',required:true},{key:'sku',label:'SKU'},{key:'category',label:'Category',required:true},{key:'price',label:'Price',type:'number',required:true},{key:'currency',label:'Currency',type:'select',options:['LRD','USD']},{key:'stock',label:'Quantity in stock',type:'number'},{key:'lowStockThreshold',label:'Low stock alert at',type:'number'}];
function Products({store,update,search,openForm,confirmDelete,notify}:{store:Store;update:(k:keyof Store,v:unknown)=>void;search:string;openForm:OpenForm;confirmDelete:any;notify:(s:string)=>void}) {
  const [filter,setFilter]=useState('All');const items=store.products.filter(p=>(`${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(search.toLowerCase()))&&(filter==='All'||(filter==='Low stock'?p.stock<=p.lowStockThreshold:filter==='Active'?p.active:!p.active)));
  const save=(v:any,old?:Product)=>{const p:Product={...v,id:old?.id||id(),price:Number(v.price),stock:Number(v.stock),lowStockThreshold:Number(v.lowStockThreshold),active:old?.active??true,currency:v.currency||store.business.currency};update('products',old?store.products.map(x=>x.id===old.id?p:x):[p,...store.products]);notify(old?'Product updated.':'Product added.');};
  return <><PageHead title="Products" subtitle="Keep your catalog and stock in order." action={<button className="button primary" onClick={()=>openForm('Add product',productFields,{category:'Pantry',currency:store.business.currency,stock:0,lowStockThreshold:5},v=>save(v))}><Plus size={15}/> Add product</button>}/>
    <div className="stat-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}><Stat label="All products" value={String(store.products.length)} note="In your local catalog" icon={Package}/><Stat label="Active" value={String(store.products.filter(p=>p.active).length)} note="Available for sales" icon={Check}/><Stat label="Low stock" value={String(store.products.filter(p=>p.stock<=p.lowStockThreshold).length)} note="At or below threshold" icon={ArrowDownRight}/></div>
    <div className="panel"><div className="toolbar"><div className="searchbar" style={{minWidth:230}}><Search size={14}/><input placeholder="Search name, SKU or category" value={search}/></div>{['All','Active','Low stock','Archived'].map(f=><button key={f} className={`button small ${filter===f?'primary':''}`} onClick={()=>setFilter(f)}>{f}</button>)}</div>
      {items.length?<div className="table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Available</th><th>Status</th><th></th></tr></thead><tbody>{items.map(p=><tr key={p.id}><td className="table-primary">{p.name}</td><td>{p.sku||'—'}</td><td>{p.category}</td><td>{money(p.price,p.currency)}</td><td><span className={p.stock<=p.lowStockThreshold?'badge amber':''}>{p.stock} units</span></td><td><span className={`badge ${p.active?'':'red'}`}>{p.active?'Active':'Archived'}</span></td><td><button className="button small" onClick={()=>openForm('Edit product',productFields,p,v=>save(v,p))}>Edit</button> <button className="button small" onClick={()=>openForm('Adjust stock',[{key:'stock',label:'New available quantity',type:'number',required:true}],{stock:p.stock},v=>{update('products',store.products.map(x=>x.id===p.id?{...x,stock:Number(v.stock)}:x));notify('Stock count updated.')})}>Adjust</button> <button className="button small danger" onClick={()=>confirmDelete('product',()=>update('products',store.products.filter(x=>x.id!==p.id)))}>Delete</button></td></tr>)}</tbody></table></div>:<Empty title="No matching products" text="Add a product to build your catalog." action="Add product" onClick={()=>openForm('Add product',productFields,{category:'Pantry',currency:store.business.currency,stock:0,lowStockThreshold:5},v=>save(v))}/>}</div>
  </>;
}
const customerFields=[{key:'name',label:'Customer name',required:true},{key:'phone',label:'Liberian phone number',required:true},{key:'email',label:'Email address',type:'email'},{key:'county',label:'County',type:'select',options:counties},{key:'notes',label:'Notes',type:'textarea'}];
function Customers({store,update,search,openForm,confirmDelete}:{store:Store;update:(k:keyof Store,v:unknown)=>void;search:string;openForm:OpenForm;confirmDelete:any}) {
  const items=store.customers.filter(c=>`${c.name} ${c.phone} ${c.email} ${c.county}`.toLowerCase().includes(search.toLowerCase()));
  const save=(v:any,old?:Customer)=>{const c={...v,id:old?.id||id()};update('customers',old?store.customers.map(x=>x.id===old.id?c:x):[c,...store.customers]);};
  return <><PageHead title="Customers" subtitle="Remember the people behind each sale." action={<button className="button primary" onClick={()=>openForm('Add customer',customerFields,{county:'Montserrado'},v=>save(v))}><Plus size={15}/> Add customer</button>}/><div className="panel"><div className="toolbar"><div className="searchbar"><Search size={14}/><input placeholder="Search customers" value={search}/></div><span className="muted" style={{fontSize:11}}>{items.length} customers</span></div>{items.length?<div className="table-wrap"><table><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>County</th><th>Notes</th><th></th></tr></thead><tbody>{items.map(c=><tr key={c.id}><td><div style={{display:'flex',alignItems:'center',gap:9}}><div className="avatar">{initials(c.name)}</div><span className="table-primary">{c.name}</span></div></td><td>{c.phone}</td><td>{c.email||'—'}</td><td>{c.county}</td><td>{c.notes||'—'}</td><td><button className="button small" onClick={()=>openForm('Edit customer',customerFields,c,v=>save(v,c))}>Edit</button> <button className="button small danger" onClick={()=>confirmDelete('customer',()=>update('customers',store.customers.filter(x=>x.id!==c.id)))}>Delete</button></td></tr>)}</tbody></table></div>:<Empty title="Your customer list starts here" text="Save customer details to make repeat visits easier." action="Add customer" onClick={()=>openForm('Add customer',customerFields,{county:'Montserrado'},v=>save(v))}/>}</div></>;
}
function Orders({store,update,search,openForm,notify}:{store:Store;update:(k:keyof Store,v:unknown)=>void;search:string;openForm:OpenForm;notify:(s:string)=>void}) {
  const [filter,setFilter]=useState('All');const [cart,setCart]=useState<Record<string,number>>({});const [customerId,setCustomerId]=useState('');const [payment,setPayment]=useState('cash');const [currency,setCurrency]=useState<'LRD'|'USD'>(store.business.currency);const [discount,setDiscount]=useState(0);
  const [saleMode,setSaleMode]=useState(false);
  const products=store.products.filter(p=>p.active&&p.stock>0);const cartItems=Object.entries(cart).map(([pid,q])=>({product:store.products.find(p=>p.id===pid)!,qty:q})).filter(x=>x.product);const subtotal=cartItems.reduce((s,x)=>s+x.product.price*x.qty,0);
  const saveSale=()=>{if(!cartItems.length){notify('Add at least one product to the sale.');return;}const items=cartItems.map(({product,qty})=>({productId:product.id,name:product.name,quantity:qty,unitPrice:product.price}));const order:Order={id:`GC-${1000+store.orders.length+1}`,createdAt:new Date().toISOString(),customerId:customerId||null,items,subtotal,discount:Math.max(0,discount),total:Math.max(0,subtotal-discount),currency,paymentMethod:payment,status:'completed'};update('orders',[order,...store.orders]);update('products',store.products.map(p=>({...p,stock:Math.max(0,p.stock-(cart[p.id]||0))})));setCart({});setSaleMode(false);notify(`Sale completed · ${order.id}`);};
  const filtered=store.orders.filter(o=>(filter==='All'||o.status===filter.toLowerCase())&&(`${o.id} ${store.customers.find(c=>c.id===o.customerId)?.name||'Walk-in'}`.toLowerCase().includes(search.toLowerCase())));
  if(saleMode)return <><PageHead title="New sale" subtitle="Build a cart, select payment and complete the transaction." action={<button className="button" onClick={()=>setSaleMode(false)}>Cancel sale</button>}/><div className="sale-layout"><div className="panel"><div className="panel-head"><h3 className="panel-title">Choose products</h3><span className="muted" style={{fontSize:11}}>{products.length} available</span></div><div className="panel-body"><div className="product-picker">{products.map(p=><button className="product-tile" key={p.id} onClick={()=>setCart({...cart,[p.id]:Math.min(p.stock,(cart[p.id]||0)+1)})}><strong>{p.name}</strong><span>{money(p.price,currency)} · {p.stock} available</span></button>)}</div>{!products.length&&<Empty title="No products ready to sell" text="Add active products with stock to begin."/>}</div></div><div className="panel"><div className="panel-head"><h3 className="panel-title">Sale details</h3><span className="badge">{cartItems.reduce((n,x)=>n+x.qty,0)} items</span></div><div className="panel-body">{cartItems.length?cartItems.map(({product,qty})=><div className="cart-row" key={product.id}><div><strong>{product.name}</strong><div className="muted">{money(product.price,currency)} each</div></div><div style={{display:'flex',alignItems:'center',gap:7}}><button className="button small" onClick={()=>setCart({...cart,[product.id]:Math.max(0,qty-1)})}>−</button><span>{qty}</span><button className="button small" onClick={()=>setCart({...cart,[product.id]:Math.min(product.stock,qty+1)})}>+</button></div></div>):<div className="empty-state" style={{padding:'24px 4px'}}><h3>Your cart is empty</h3><p>Select products to add them to this sale.</p></div>}
      <div className="field" style={{marginTop:18}}><label>Customer</label><select value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Walk-in customer</option>{store.customers.map(c=><option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}</select></div>
      <div className="form-grid"><div className="field"><label>Currency</label><select value={currency} onChange={e=>setCurrency(e.target.value as 'LRD'|'USD')}><option>LRD</option><option>USD</option></select></div><div className="field"><label>Payment method</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option value="cash">Cash</option><option value="mobile-money">Mobile money</option><option value="card">Card</option><option value="bank-transfer">Bank transfer</option></select></div></div>
      <div className="field"><label>Discount amount ({currency})</label><input type="number" min="0" max={subtotal} value={discount} onChange={e=>setDiscount(Number(e.target.value))}/></div>
      <div className="cart-row"><span>Subtotal</span><strong>{money(subtotal,currency)}</strong></div><div className="cart-row"><span>Discount</span><strong>− {money(discount,currency)}</strong></div><div className="cart-row" style={{fontSize:15}}><strong>Total due</strong><strong>{money(Math.max(0,subtotal-discount),currency)}</strong></div>
      <button className="button primary" style={{width:'100%',marginTop:16}} onClick={saveSale}><Check size={15}/> Complete sale</button><p className="muted" style={{fontSize:10,lineHeight:1.5}}>Demo only. No live payment is processed.</p></div></div></div></>;
  return <><PageHead title="Orders" subtitle="Review transactions or ring up a new sale." action={<button className="button primary" onClick={()=>setSaleMode(true)}><Plus size={15}/> Create sale</button>}/><div className="stat-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}><Stat label="Orders" value={String(store.orders.length)} note="All recorded transactions" icon={ClipboardList}/><Stat label="Sales collected" value={money(store.orders.filter(o=>o.status==='completed').reduce((a,o)=>a+o.total,0),store.business.currency)} note="Completed transactions" icon={CircleDollarSign}/><Stat label="Average order" value={money(store.orders.length?Math.round(store.orders.reduce((a,o)=>a+o.total,0)/store.orders.length):0,store.business.currency)} note="Across all orders" icon={Gauge}/></div><div className="panel"><div className="toolbar"><div className="searchbar"><Search size={14}/><input placeholder="Search order or customer" value={search}/></div>{['All','Completed','Refunded'].map(f=><button className={`button small ${filter===f?'primary':''}`} key={f} onClick={()=>setFilter(f)}>{f}</button>)}</div>{filtered.length?<div className="table-wrap"><table><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(o=><tr key={o.id}><td className="table-primary">#{o.id}</td><td>{dateText(o.createdAt)}</td><td>{store.customers.find(c=>c.id===o.customerId)?.name||'Walk-in'}</td><td>{o.items.reduce((s,i)=>s+i.quantity,0)}</td><td style={{textTransform:'capitalize'}}>{o.paymentMethod.replace('-',' ')}</td><td>{money(o.total,o.currency)}</td><td><span className={`badge ${o.status==='refunded'?'red':''}`}>{o.status}</span></td><td>{o.status==='completed'&&<button className="button small danger" onClick={()=>openForm('Refund order',[],{},()=>{update('orders',store.orders.map(x=>x.id===o.id?{...x,status:'refunded'}:x));notify('Order marked refunded. Inventory is unchanged.')},'Confirm this demo order refund. No payment will be reversed.')}>Refund</button>}</td></tr>)}</tbody></table></div>:<Empty title="No orders found" text="Your next sale can be recorded here." action="Create sale" onClick={()=>setSaleMode(true)}/>}</div></>;
}
const discountFields=[{key:'name',label:'Discount name',required:true},{key:'code',label:'Discount code',required:true},{key:'type',label:'Discount type',type:'select',options:['percent','fixed']},{key:'value',label:'Value',type:'number',required:true},{key:'startsAt',label:'Starts on',type:'date'},{key:'endsAt',label:'Ends on',type:'date'}];
function Discounts({store,update,search,openForm,confirmDelete}:{store:Store;update:(k:keyof Store,v:unknown)=>void;search:string;openForm:OpenForm;confirmDelete:any}) {
  const save=(v:any,old?:Discount)=>{const d={...v,id:old?.id||id(),value:Number(v.value),active:old?.active??true};update('discounts',old?store.discounts.map(x=>x.id===old.id?d:x):[d,...store.discounts]);};
  const items=store.discounts.filter(x=>`${x.name} ${x.code}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHead title="Discounts" subtitle="Give customers a reason to come back." action={<button className="button primary" onClick={()=>openForm('Create discount',discountFields,{type:'percent',value:10},v=>save(v))}><Plus size={15}/> Create discount</button>}/><div className="panel">{items.length?<div className="table-wrap"><table><thead><tr><th>Discount</th><th>Code</th><th>Type</th><th>Value</th><th>Schedule</th><th>Status</th><th></th></tr></thead><tbody>{items.map(d=><tr key={d.id}><td className="table-primary">{d.name}</td><td><span style={{fontFamily:'var(--app-font-mono)'}}>{d.code}</span></td><td>{d.type}</td><td>{d.type==='percent'?`${d.value}%`:money(d.value,store.business.currency)}</td><td>{d.startsAt||'Now'} — {d.endsAt||'No end date'}</td><td><span className={`badge ${d.active?'':'red'}`}>{d.active?'Active':'Inactive'}</span></td><td><button className="button small" onClick={()=>openForm('Edit discount',discountFields,d,v=>save(v,d))}>Edit</button> <button className="button small" onClick={()=>update('discounts',store.discounts.map(x=>x.id===d.id?{...x,active:!x.active}:x))}>{d.active?'Pause':'Activate'}</button> <button className="button small danger" onClick={()=>confirmDelete('discount',()=>update('discounts',store.discounts.filter(x=>x.id!==d.id)))}>Delete</button></td></tr>)}</tbody></table></div>:<Empty title="No discounts set up" text="Create a code for a seasonal offer or regular customers." action="Create discount" onClick={()=>openForm('Create discount',discountFields,{type:'percent',value:10},v=>save(v))}/>}</div></>;
}
function Analytics({store,period,setPeriod}:{store:Store;period:string;setPeriod:(s:string)=>void}) {
  const orders=store.orders.filter(o=>o.status==='completed'), rev=orders.reduce((s,o)=>s+o.total,0);
  const labels=period==='7 days'?['Mon','Tue','Wed','Thu','Fri','Sat','Sun']:period==='30 days'?['Wk 1','Wk 2','Wk 3','Wk 4']:['Jan','Feb','Mar','Apr','May','Jun'];
  const values=labels.map((_,i)=>Math.round((rev/labels.length)*(0.45+((i*37+15)%63)/100)));
  const max=Math.max(...values,1);
  const cats:Record<string,number>={};orders.flatMap(o=>o.items).forEach(i=>{const p=store.products.find(x=>x.id===i.productId);const cat=p?.category||'Other';cats[cat]=(cats[cat]||0)+i.unitPrice*i.quantity;});
  return <><PageHead title="Analytics" subtitle="A clearer picture of your sales and products." action={<select className="button" value={period} onChange={e=>setPeriod(e.target.value)}><option>7 days</option><option>30 days</option><option>6 months</option></select>}/><div className="stat-grid"><Stat label="Gross sales" value={money(rev,store.business.currency)} note={`Selected period · ${period}`} icon={CircleDollarSign}/><Stat label="Orders" value={String(orders.length)} note="Completed sales" icon={ShoppingCart}/><Stat label="Average order value" value={money(orders.length?Math.round(rev/orders.length):0,store.business.currency)} note="Per completed order" icon={ArrowUpRight}/><Stat label="Returning customers" value={`${store.customers.filter(c=>orders.filter(o=>o.customerId===c.id).length>1).length}`} note="More than one purchase" icon={Users}/></div><div style={{display:'grid',gridTemplateColumns:'1.35fr .8fr',gap:16}}><div className="panel"><div className="panel-head"><div><h3 className="panel-title">Sales over time</h3><span className="muted" style={{fontSize:11}}>Gross order total · {period}</span></div><BarChart3 size={18} color="#368a5c"/></div><div className="panel-body"><div className="chart-bars">{values.map((v,i)=><div className="bar-col" key={labels[i]}><span style={{fontSize:9,color:'#858b88'}}>{money(v,store.business.currency)}</span><div className="bar" style={{height:`${Math.max(8,v/max*68)}%`}}/><span className="bar-label">{labels[i]}</span></div>)}</div></div></div><div className="panel"><div className="panel-head"><h3 className="panel-title">Sales by category</h3></div><div className="panel-body">{Object.entries(cats).length?Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([category,total],i)=><div style={{marginBottom:18}} key={category}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:7}}><span>{category}</span><strong>{money(total,store.business.currency)}</strong></div><div style={{height:7,background:'#eff1ec',borderRadius:8}}><div style={{height:'100%',width:`${Math.max(8,total/rev*100)}%`,background:['#348b5c','#e1aa4c','#5689a4','#bd7567'][i%4],borderRadius:8}}/></div></div>):<Empty title="Sales categories appear here" text="Complete sales with catalog items to see a breakdown."/>}</div></div></div></>;
}
function Finance({store}:{store:Store}) {
  const orders=store.orders.filter(o=>o.status==='completed');const total=orders.reduce((s,o)=>s+o.total,0);const methods=['cash','mobile-money','card','bank-transfer'];
  return <><PageHead title="Finance" subtitle="A simple view of your recorded payments." action={<span className="badge">Demo ledger</span>}/><div className="stat-grid"><Stat label="Gross collected" value={money(total,store.business.currency)} note="Completed transactions" icon={Wallet}/><Stat label="Cash payments" value={money(orders.filter(o=>o.paymentMethod==='cash').reduce((s,o)=>s+o.total,0),store.business.currency)} note="Recorded as cash" icon={CircleDollarSign}/><Stat label="Mobile money" value={money(orders.filter(o=>o.paymentMethod==='mobile-money').reduce((s,o)=>s+o.total,0),store.business.currency)} note="No provider connected" icon={CreditCard}/><Stat label="Refunds" value={money(store.orders.filter(o=>o.status==='refunded').reduce((s,o)=>s+o.total,0),store.business.currency)} note="Marked refunded in demo" icon={ArrowDownRight}/></div><div className="panel"><div className="panel-head"><h3 className="panel-title">Payment summary</h3><span className="muted" style={{fontSize:11}}>All demo orders</span></div><div className="table-wrap"><table><thead><tr><th>Payment method</th><th>Transactions</th><th>Gross amount</th><th>Share</th></tr></thead><tbody>{methods.map(m=>{const os=orders.filter(o=>o.paymentMethod===m),sum=os.reduce((s,o)=>s+o.total,0);return <tr key={m}><td style={{textTransform:'capitalize'}}>{m.replace('-',' ')}</td><td>{os.length}</td><td>{money(sum,store.business.currency)}</td><td>{total?Math.round(sum/total*100):0}%</td></tr>})}</tbody></table></div></div><div className="callout" style={{marginTop:16}}>GotecxPOS is not connected to a payment provider. Totals are for record keeping only; no funds are processed.</div></>;
}
function Team({store,update,openForm,confirmDelete}:{store:Store;update:(k:keyof Store,v:unknown)=>void;openForm:OpenForm;confirmDelete:any}) {
  const fields=[{key:'name',label:'Name',required:true},{key:'email',label:'Email',type:'email',required:true},{key:'role',label:'Role',type:'select',options:['manager','cashier']}];
  const save=(v:any,old?:TeamMember)=>{const member={...v,id:old?.id||id()};update('team',old?store.team.map(x=>x.id===old.id?member:x):[...store.team,member]);};
  return <><PageHead title="Team" subtitle="Manage who helps run this workspace." action={<button className="button primary" onClick={()=>openForm('Add a team member',fields,{role:'cashier'},v=>save(v),'Demo only. This adds a local profile; no invitation email is sent.')}><Plus size={15}/> Add team member</button>}/><div className="callout" style={{marginBottom:16}}>Team members are local demo profiles only. No invitations are sent and there are no individual sign-ins.</div><div className="panel"><div className="table-wrap"><table><thead><tr><th>Team member</th><th>Email</th><th>Role</th><th>Access</th><th></th></tr></thead><tbody>{store.team.map(u=><tr key={u.id}><td><div style={{display:'flex',alignItems:'center',gap:9}}><div className="avatar">{initials(u.name)}</div><span className="table-primary">{u.name}</span></div></td><td>{u.email}</td><td><span className="badge">{u.role}</span></td><td>{u.role==='owner'?'Full access':u.role==='manager'?'Store management':'Sales and customers'}</td><td>{u.role!=='owner'&&<><button className="button small" onClick={()=>openForm('Edit team member',fields,u,v=>save(v,u))}>Edit</button> <button className="button small danger" onClick={()=>confirmDelete('team member',()=>update('team',store.team.filter(x=>x.id!==u.id)))}>Remove</button></>}</td></tr>)}</tbody></table></div></div></>;
}
function Markets({store,update,openForm,notify}:{store:Store;update:(k:keyof Store,v:unknown)=>void;openForm:OpenForm;notify:(s:string)=>void}) {
  const b=store.business;
  return <><PageHead title="Markets" subtitle="Set the defaults your Liberian customers see." action={<button className="button primary" onClick={()=>openForm('Edit market defaults',[{key:'currency',label:'Store currency',type:'select',options:['LRD','USD']},{key:'county',label:'Primary county',type:'select',options:counties},{key:'city',label:'City or town'},{key:'timezone',label:'Timezone',type:'select',options:['Africa/Monrovia']}],b,v=>{update('business',{...b,...v});notify('Market preferences saved.')})}>Edit settings</button>}/><div className="panel" style={{maxWidth:820}}><div className="panel-head"><div><h3 className="panel-title">{b.name}</h3><span className="muted" style={{fontSize:11}}>Primary market · Liberia</span></div><span className="badge">Active</span></div><div className="panel-body"><div className="form-grid"><div className="field"><label>Country</label><input value="Liberia" readOnly/></div><div className="field"><label>Currency</label><input value={`${b.currency} · ${b.currency==='LRD'?'Liberian Dollar':'US Dollar'}`} readOnly/></div><div className="field"><label>County</label><input value={b.county} readOnly/></div><div className="field"><label>City or town</label><input value={b.city} readOnly/></div><div className="field wide"><label>Timezone</label><input value="Africa/Monrovia (GMT)" readOnly/></div></div><div className="callout">Liberia is your fixed home market. Store currency defaults to LRD and business time follows Africa/Monrovia. This is a local demo configuration.</div></div></div></>;
}
function Growth({setPath,store}:{setPath:(p:string)=>void;store:Store}) {
  const cards=[{title:'Bring customers back',text:'Keep customer names and numbers close to each sale. Build a useful record of the people who choose your business.',cta:'Add a customer',to:'/customers',icon:Users},{title:'Make an offer',text:'Set up a discount code for a new product, a quiet day, or your regular customers.',cta:'Create discount',to:'/discounts',icon:Tag},{title:'Know what moves',text:'Use your sales history to spot best sellers and plan your next stock run.',cta:'View analytics',to:'/analytics',icon:BarChart3}];
  return <><PageHead title="Growth" subtitle="Small ways to bring people back and grow steadily."/><div className="callout" style={{marginBottom:18}}>You have {store.customers.length} customers and {store.discounts.length} discounts in this workspace. Here are a few practical next steps.</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:14}}>{cards.map(({title,text,cta,to,icon:Icon})=><div className="panel" key={title} style={{padding:21}}><div className="stat-accent" style={{position:'static',display:'inline-flex',marginBottom:14}}><Icon size={17}/></div><h3 style={{fontSize:16,margin:'0 0 8px'}}>{title}</h3><p className="muted" style={{fontSize:12,lineHeight:1.7,minHeight:62}}>{text}</p><button className="button" onClick={()=>setPath(to)}>{cta}</button></div>)}</div><div className="panel" style={{marginTop:16}}><div className="panel-head"><h3 className="panel-title">A simple weekly rhythm</h3></div><div className="panel-body" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16}}>{[['01','Check stock','Refill the items customers ask for most.'],['02','Note repeat visits','Save a customer profile when it helps.'],['03','Review the week','Use analytics to decide what to try next.']].map(x=><div key={x[0]}><span style={{font:'12px var(--app-font-mono)',color:'#38885b'}}>{x[0]}</span><h4 style={{margin:'7px 0',fontSize:13}}>{x[1]}</h4><p className="muted" style={{margin:0,fontSize:11,lineHeight:1.6}}>{x[2]}</p></div>)}</div></div></>;
}
function Content({setPath,store,notify}:{setPath:(p:string)=>void;store:Store;notify:(s:string)=>void}) {
  return <><PageHead title="Content" subtitle="Manage the story customers see when they find your business." action={<button className="button" onClick={()=>notify('Store preview is not available in this local demo.')}>Preview storefront</button>}/><div className="panel" style={{maxWidth:880}}><div className="panel-head"><div><h3 className="panel-title">Online storefront</h3><span className="muted" style={{fontSize:11}}>A local preview setup · not published</span></div><span className="badge amber">Private</span></div><div className="panel-body"><div style={{background:'#e5eee7',borderRadius:10,padding:25,marginBottom:18}}><div style={{font:'10px var(--app-font-mono)',color:'#42815d',letterSpacing:1}}>WELCOME TO</div><h2 style={{fontSize:29,margin:'8px 0',fontFamily:'var(--app-font-serif)',fontWeight:400}}>{store.business.name}</h2><p className="muted" style={{fontSize:12}}>Local goods and everyday essentials from {store.business.city}, Liberia.</p></div><div className="form-grid"><div><h4 style={{fontSize:13}}>Catalog</h4><p className="muted" style={{fontSize:11,lineHeight:1.6}}>{store.products.length} products in the shop catalog.</p><button className="button small" onClick={()=>setPath('/products')}>Manage products</button></div><div><h4 style={{fontSize:13}}>Store status</h4><p className="muted" style={{fontSize:11,lineHeight:1.6}}>No public storefront is published from this demo workspace.</p><button className="button small" onClick={()=>notify('Publishing is disabled in the local demo.')}>Store settings</button></div></div></div></div></>;
}
function SettingsPage({store,update,tab,setTab,notify}:{store:Store;update:(k:keyof Store,v:unknown)=>void;tab:string;setTab:(s:string)=>void;notify:(s:string)=>void}) {
  const [draft,setDraft]=useState<Record<string,string>>({...store.settings});
  useEffect(()=>setDraft({...store.settings}),[tab,store.settings]);
  const set=(key:string,val:string)=>setDraft({...draft,[key]:val});
  const save=()=>{update('settings',{...store.settings,...draft});if(tab==='General')update('business',{...store.business,name:draft.businessName||store.business.name,category:draft.category||store.business.category,county:draft.county||store.business.county,city:draft.city||store.business.city,currency:(draft.currency||store.business.currency) as 'LRD'|'USD'});notify(`${tab} preferences saved.`);};
  const fallback=(key:string)=>store.settings[key]??({businessName:store.business.name,category:store.business.category,county:store.business.county,city:store.business.city,currency:store.business.currency,timezone:store.business.timezone}[key] as string|undefined)??'';
  const field=(label:string,key:string,type='text',options?:string[])=><div className="field" key={key}><label>{label}</label>{options?<select value={draft[key]??(fallback(key)||options[0])} onChange={e=>set(key,e.target.value)}>{options.map(x=><option key={x}>{x}</option>)}</select>:<input type={type} value={draft[key]??fallback(key)} placeholder={label} onChange={e=>set(key,e.target.value)}/>}</div>;
  const titleText:Record<string,string>={General:'Business details and store defaults',Plan:'Choose a plan for your business',Billing:'Billing contact and invoices',Users:'People with access to this store',Payments:'Ways customers can pay',Checkout:'A smooth counter checkout', 'Customer accounts':'Customer profile preferences','Shipping and delivery':'Local pickup and delivery options','Taxes and duties':'Tax settings for your records',Locations:'Business locations','Markets':'Country, currency and time zone',Apps:'Extensions for your workspace','Sales channels':'Where you sell','Domains':'Your online address',Notifications:'Updates for your business'};
  return <><PageHead title="Settings" subtitle="Set up the details and preferences behind your workspace."/><div className="settings-layout"><div className="panel settings-nav">{settingsItems.map(x=><button key={x} className={tab===x?'selected':''} onClick={()=>setTab(x)}>{x}</button>)}</div><div className="panel"><div className="panel-head"><div><h3 className="panel-title">{tab}</h3><span className="muted" style={{fontSize:11}}>{titleText[tab]}</span></div></div><div className="panel-body">
    {tab==='General'&&<><h4 style={{fontSize:12,margin:'0 0 13px'}}>Business details</h4><div className="form-grid">{field('Business name','businessName')}{field('Business type','category','select',['Retail','Food & beverage','Beauty & personal care','Professional services','Handmade goods','Other'])}{field('Country','country','select',['Liberia'])}{field('County','county','select',counties)}{field('City / town','city')}{field('Store currency','currency','select',['LRD','USD'])}{field('Timezone','timezone','select',['Africa/Monrovia'])}</div><div className="callout">Liberia is fixed as your business country. Your local timezone is Africa/Monrovia.</div></>}
    {tab==='Plan'&&<><div className="callout" style={{marginBottom:17}}>You are using the Gotecx demo plan. All features in this workspace are available locally.</div><div className="panel" style={{padding:18}}><div style={{display:'flex',justifyContent:'space-between'}}><div><h3 style={{margin:'0 0 6px',fontSize:15}}>Local demo</h3><span className="muted" style={{fontSize:11}}>No subscription or payment required</span></div><span className="badge">Current plan</span></div></div></>}
    {tab==='Billing'&&<><div className="callout" style={{marginBottom:16}}>Billing is not connected in this demo. These preferences are stored in your browser only.</div><div className="form-grid">{field('Billing contact name','billingName')}{field('Billing email','billingEmail','email')}{field('Business address','billingAddress')}</div></>}
    {tab==='Users'&&<><div className="callout" style={{marginBottom:16}}>Local team profiles only. No account invitations or shared access are provided.</div><div className="cart-row"><span>Team members</span><strong>{store.team.length}</strong></div><button className="button" style={{marginTop:14}} onClick={()=>setTab('Users')}>Current user: {store.user.name} · {store.user.role}</button></>}
    {tab==='Payments'&&<><div className="callout" style={{marginBottom:16}}>No real payment provider is connected. Select the methods you accept at your counter.</div>{['Cash','Mobile money','Card','Bank transfer'].map((x,i)=><label key={x} className="cart-row" style={{cursor:'pointer'}}><span>{x}</span><input type="checkbox" checked={(draft[`payment-${i}`]??store.settings[`payment-${i}`]??(i<2?'true':'false'))==='true'} onChange={e=>set(`payment-${i}`,String(e.target.checked))}/></label>)}</>}
    {tab==='Checkout'&&<><p className="muted" style={{fontSize:12,lineHeight:1.7}}>Choose how you want your team to capture a sale at the point of sale.</p><div className="form-grid">{field('Receipt footer','receiptFooter')}{field('Default payment method','defaultPayment','select',['cash','mobile-money','card','bank-transfer'])}{field('Ask for customer each sale','askCustomer','select',['Optional','Required','Never'])}</div></>}
    {tab==='Customer accounts'&&<><p className="muted" style={{fontSize:12,lineHeight:1.7}}>Keep customer records useful and respectful. Phone numbers should use the +231 country code when possible.</p><div className="form-grid">{field('Default customer county','defaultCounty','select',counties)}{field('Customer account mode','customerMode','select',['Optional','Required','Disabled'])}</div></>}
    {tab==='Shipping and delivery'&&<><p className="muted" style={{fontSize:12,lineHeight:1.7}}>Set how local customers can collect or receive an order.</p><div className="form-grid">{field('Pickup location','pickupLocation')}{field('Delivery areas','deliveryAreas')}{field('Standard delivery fee (LRD)','deliveryFee','number')}{field('Estimated delivery time','deliveryTime')}</div></>}
    {tab==='Taxes and duties'&&<><div className="callout" style={{marginBottom:16}}>Tax calculations are not applied to demo sales. Confirm requirements for your business with a qualified local adviser.</div><div className="form-grid">{field('Tax display','taxDisplay','select',['Prices include tax','Add tax at checkout','Do not show tax'])}{field('Tax reference','taxReference')}</div></>}
    {tab==='Locations'&&<><div className="panel" style={{padding:16,marginBottom:16}}><strong style={{fontSize:13}}>{store.business.name}</strong><p className="muted" style={{fontSize:11,marginBottom:0}}>{store.business.city}, {store.business.county}, Liberia · Primary location</p></div><div className="form-grid">{field('Location phone','locationPhone')}{field('Location address','locationAddress')}</div></>}
    {tab==='Markets'&&<><div className="callout" style={{marginBottom:16}}>Your primary market is Liberia. Currency support is for recording demo sales only.</div><div className="form-grid">{field('Primary country','primaryCountry','select',['Liberia'])}{field('Default currency','marketCurrency','select',['LRD','USD'])}{field('Time zone','marketTimezone','select',['Africa/Monrovia'])}</div></>}
    {tab==='Apps'&&<><div className="empty-state"><div className="empty-state-mark"><Settings size={20}/></div><h3>No apps connected</h3><p>App connections are not available in this local demo. No external services are contacted.</p></div></>}
    {tab==='Sales channels'&&<><div className="cart-row"><span>Point of sale</span><span className="badge">Enabled</span></div><div className="cart-row"><span>Online storefront preview</span><span className="badge amber">Private demo</span></div><p className="muted" style={{fontSize:11}}>No public sales channel is connected.</p></>}
    {tab==='Domains'&&<><div className="callout" style={{marginBottom:16}}>A public domain is not included in this browser-only demo.</div>{field('Store subdomain','subdomain')}</>}
    {tab==='Notifications'&&<><p className="muted" style={{fontSize:12}}>Choose which reminders appear in your workspace. No email or SMS notifications are sent.</p>{['Low stock reminders','Daily sales summary','New customer reminders'].map((x,i)=><label className="cart-row" key={x}><span>{x}</span><input type="checkbox" checked={(draft[`notify-${i}`]??store.settings[`notify-${i}`]??'true')==='true'} onChange={e=>set(`notify-${i}`,String(e.target.checked))}/></label>)}</>}
    <div className="dialog-actions"><button className="button primary" onClick={save}>Save {tab.toLowerCase()} settings</button></div>
  </div></div></div></>;
}

export default App;
