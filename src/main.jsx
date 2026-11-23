import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {restaurant,maps,locationQuery,directions,menu,groups,defaults,quote,money} from './data';
import './style.css';

const nav = [['Home','home'],['Our Menu','menu'],['Build Your Burger','builder'],['Our Story','story'],['Location','location']];
const photo = name => '/' + name + '.webp';
function DeliveryLinks({primary=false}) {
  return <div className="actions delivery-links">{restaurant.delivery.map(({label,logo,href})=>(
    <a className={primary?'button delivery-button delivery-primary':'button delivery-button'} key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={'Order on '+label}>
      <img src={logo} alt=""/>
    </a>
  ))}</div>;
}

// The shared cut lines follow the ingredient seams in the original photograph.
const heroCuts = [
  '0 0, 100% 0',
  '0 40%, 16% 42%, 30% 39%, 51% 37%, 72% 37%, 84% 42%, 100% 44%',
  '0 46%, 16% 47%, 32% 48%, 51% 42%, 72% 43%, 85% 47%, 100% 48%',
  '0 51%, 16% 52%, 36% 50%, 51% 49%, 73% 49%, 86% 51%, 100% 51%',
  '0 56%, 17% 56%, 36% 55%, 50% 53%, 72% 54%, 86% 56%, 100% 56%',
  '0 60%, 17% 60%, 36% 59%, 53% 58%, 72% 57%, 86% 59%, 100% 60%',
  '0 65%, 17% 63%, 36% 68%, 54% 65%, 72% 65%, 86% 65%, 100% 67%',
  '0 70%, 16% 70%, 35% 71%, 54% 68%, 73% 71%, 86% 70%, 100% 71%',
  '0 74%, 16% 74%, 35% 77%, 54% 73%, 73% 79%, 86% 75%, 100% 75%',
  '0 80%, 16% 78%, 35% 79%, 55% 81%, 73% 80%, 86% 78%, 100% 80%',
  '0 100%, 100% 100%'
].map(line => line.split(', '));

const heroDrizzles = new Map([[1, 'sauce'], [5, 'cheese'], [7, 'lower-cheese']]);

function HeroBurger() {
  return (
    <div className="hero-visual">
      <div className="hero-art">
        <img className="hero-photo" src={photo('hero')} alt="Double smash burger with melted cheese, lettuce, tomato, pickles and sauce" width="1200" height="1097" fetchPriority="high"/>
        <div className="hero-stack" aria-hidden="true">
          {heroCuts.slice(0, -1).map((top, index) => {
            const bottom = heroCuts[index + 1].slice().reverse();
            const drizzle = heroDrizzles.get(index);
            return <div key={index} className={drizzle ? 'hero-slice hero-drizzle' : 'hero-slice'} data-drizzle={drizzle} style={{
              '--slice': heroCuts.length - index - 2,
              clipPath: 'polygon(' + [...top, ...bottom].join(', ') + ')'
            }}/>;
          })}
        </div>
      </div>
    </div>
  );
}

function Burger({selection,assembly=false}) {
  const {bun,patty,cheese,toppings,sauce,extras} = selection;
  const patties = ['Single Smash','Double Smash','Triple Smash'].indexOf(patty)+1+Number(extras.includes('Extra Patty'));
  const layers = [['bun-top',bun],...toppings.map(name=>[name.toLowerCase(),name]),...sauce.map(name=>['sauce',name]),...(extras.includes('Extra Sauce')?[['sauce','Extra Sauce']]:[]),...(extras.includes('Crispy Beef Bacon')?[['bacon','Crispy Beef Bacon']]:[])];
  if (extras.includes('Extra Cheese')) layers.push(['cheese','Extra Cheese']);
  for (let index=0; index<patties; index++) {
    if (cheese !== 'No Cheese') layers.push(['cheese',cheese]);
    layers.push(['patty',patty]);
  }
  layers.push(['bun-bottom',bun]);
  return <div className={'burger-stack '+(assembly?'assembly':'')} role="img" aria-label={quote(selection).details.join(', ')}>{layers.toReversed().map(([type,name],index)=><div key={type+name+(type==='patty'||type==='cheese'?index:0)} className={'layer '+type} data-ingredient={name} style={{'--sequence':index}} />).reverse()}</div>;
}

function App() {
  const [category,setCategory]=useState(menu[0][0]);
  const [selection,setSelection]=useState(defaults);
  const [editing,setEditing]=useState(null);
  const [mobile,setMobile]=useState(false);
  const [panel,setPanel]=useState('cart');
  const [message,setMessage]=useState('');
  const dialog=useRef(null);
  const [cart,setCart]=useState(()=>{
    try {const value=JSON.parse(localStorage.getItem('hanjos-cart-v1'));return Array.isArray(value)?value:[];} catch {return [];}
  });
  useEffect(()=>{try{localStorage.setItem('hanjos-cart-v1',JSON.stringify(cart));}catch{}},[cart]);
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
    }),{threshold:0.2});
    document.querySelectorAll('.assembly, .hero-visual').forEach(element=>observer.observe(element));
    return ()=>observer.disconnect();
  },[]);
  const count=cart.reduce((sum,line)=>sum+line.qty,0);
  const subtotal=cart.reduce((sum,line)=>sum+line.cents*line.qty,0);
  const incomplete=cart.some(line=>line.pending?.length);
  const tax=restaurant.taxRate===null?null:Math.round(subtotal*restaurant.taxRate);
  const fee=restaurant.feeCents;
  const total=subtotal+(tax??0)+(fee??0);
  const current=quote(selection);
  const openCart=()=>{setPanel('cart');if(!dialog.current.open)dialog.current.showModal();};
  function add(product) {
    setCart(previous=>{
      if(editing && product.selection) return previous.map(line=>line.id===editing?{...line,...product}:line);
      const match=previous.find(line=>line.name===product.name && JSON.stringify(line.selection)===JSON.stringify(product.selection));
      return match?previous.map(line=>line.id===match.id?{...line,qty:line.qty+1}:line):[...previous,{...product,id:crypto.randomUUID(),qty:1}];
    });
    setMessage((editing && product.selection?'Updated ':'Added ')+product.name);
    if (product.selection) {setEditing(null);setSelection(defaults);}
    openCart();
  }
  function changeQuantity(id,delta) {
    setCart(previous=>previous.map(line=>line.id===id?{...line,qty:line.qty+delta}:line).filter(line=>line.qty>0));
  }
  function choose(group,name) {
    setSelection(previous=>({...previous,[group.key]:group.multiple?(previous[group.key].includes(name)?previous[group.key].filter(item=>item!==name):group.options.map(item=>item.name).filter(item=>item===name || previous[group.key].includes(item))):name}));
  }
  return <>
    <a className="skip" href="#main">Skip to content</a>
    <header className="header"><div className="shell nav">
      <a href="#home" aria-label="Hanjo’s home" className="logo"><img src="/logo.png" width="92" height="92" alt="Hanjo’s Smashed Burgers"/></a>
      <button className="mobile-toggle outline" aria-controls="site-nav" aria-expanded={mobile} onClick={()=>setMobile(!mobile)}>{mobile?'Close':'Menu'}</button>
      <nav id="site-nav" aria-label="Main navigation" className={mobile?'expanded':''}>{nav.map(([label,id])=><a key={id} href={'#'+id} onClick={()=>setMobile(false)}>{label}</a>)}<a className="mobile-order" href="#order" onClick={()=>setMobile(false)}>Order Now</a></nav>
      <a className="button order" href="#order">Order Now</a>
      <button className="cart-button" onClick={openCart} aria-label={'Cart, '+count+' items'}><svg width="21" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 8h16l1 13H3L4 8Z M8 9V6a4 4 0 0 1 8 0v3"/></svg><span>{count}</span></button>
    </div></header>
    <main id="main">
      <section id="home" className="hero"><div className="shell hero-inner">
        <div className="hero-copy">
          <div className="hero-markers">
            <p className="eyebrow">CHESTERFIELD, MISSOURI</p>
            <span className="halal-badge">
              <span className="halal-arabic" lang="ar" aria-hidden="true">حلال</span>
              <span>100% Halal</span>
            </span>
          </div>
          <h1>Smashed crisp. <em>Sauced the Hanjo’s way.</em></h1>
          <div className="hero-details">
            <p className="lead">Fresh halal smash burgers, made to order with Hanjo’s signature sauce.</p>
            <DeliveryLinks primary/>
            <div className="actions hero-secondary"><a href="#menu">Explore Our Menu</a><a href="#builder">Build Your Burger</a></div>
          </div>
        </div>
        <HeroBurger/>
      </div></section>
      <section className="sauce" aria-labelledby="sauce-title"><div className="shell split">
        <img className="feature-photo" src={photo('sauce')} alt="Signature sauce pouring over a smash burger" loading="lazy"/>
        <div><p className="eyebrow">HANJO’S SIGNATURE SAUCE</p><h2 id="sauce-title">THE SECRET IS <em>IN THE SAUCE.</em></h2><p className="lead">One bite and you’ll understand. Hanjo’s Sauce brings everything together.</p><a className="button" href="#builder" onClick={()=>setSelection(previous=>({...previous,sauce:[...new Set([...previous.sauce,groups.find(group=>group.key==="sauce").options[0].name])]}))}>Build with Hanjo’s Sauce</a></div>
      </div></section>
      <section id="menu" className="menu light"><div className="shell">
        <p className="eyebrow">FRESH OFF THE GRIDDLE</p><h2>OUR MENU.</h2>
        <div className="filters" aria-label="Menu categories">{menu.map(([name])=><button key={name} aria-pressed={category===name} onClick={()=>setCategory(name)}>{name}</button>)}</div>
        <h3>{category}</h3>
        <div className={'menu-grid '+(category==='Fan Favorites'?'featured':'')}>{menu.find(([name])=>name===category)[1].map(product=><article className="product" key={product.name}>
          {product.image&&<img src={photo(product.image)} loading="lazy" alt=""/>}
          <div className="product-copy"><h4>{product.name}</h4>{product.description&&<p>{product.description}</p>}<div><strong>{money(product.cents)}</strong><button className="add" aria-label={'Add '+product.name+' to cart'} onClick={()=>add(product)}>+ Add</button></div></div>
        </article>)}</div>
      </div></section>
      <section id="builder" className="builder"><div className="shell">
        <p className="eyebrow">BUILD YOUR BURGER</p><h2>YOUR BURGER. <em>YOUR RULES.</em></h2><p className="lead">Build it your way. Make it a Hanjo’s.</p>
        <div className="builder-grid">
          <div className="controls">{groups.map(group=><fieldset key={group.key}><legend>{group.label}</legend><div className="options">{group.options.map(({name,cents})=>{
            const active=[selection[group.key]].flat().includes(name);
            return <label key={name} className={active?'selected':''}><input type={group.multiple?'checkbox':'radio'} name={group.key} checked={active} onChange={()=>choose(group,name)}/><span>{name}</span>{cents===null?<small>Price TBD</small>:cents>0?<small>{group.base?'':'+'}{money(cents)}</small>:null}</label>;
          })}</div></fieldset>)}</div>
          <div className="preview"><Burger selection={selection} assembly/></div>
          <aside className="summary" aria-label="Burger summary"><h3>{editing?'Edit your burger':'Your burger'}</h3><ul>{current.details.map(name=><li key={name}>{name}</li>)}</ul>
            {current.pending.length>0&&<p className="muted">Pricing is pending for {current.pending.join(', ')}.</p>}
            <div className="summary-action"><strong>{current.baseMissing?(current.cents?money(current.cents)+' priced extras':'Price pending'):money(current.cents)+(current.pending.length?' + pending':'')}</strong><button className="button" onClick={()=>add({...current,name:'Build Your Burger',selection})}>{editing?'Save changes':'Add to Cart'}</button></div>
            {editing&&<button className="outline" onClick={()=>{setEditing(null);setSelection(defaults);}}>Cancel edit</button>}
          </aside>
        </div>
      </div></section>
      <section id="story" className="story"><div className="shell split"><div>
        <p className="eyebrow">OUR STORY</p><h2>GOOD BURGERS.<br/> GOOD PEOPLE.<br/> <em>GOOD TIMES.</em></h2>
      </div><div><p className="lead">Founded by two friends with a passion for great food.</p><p>At Hanjo’s, we believe a great burger starts with quality ingredients, the perfect smash, and flavors worth coming back for. From our signature smash burgers to Hanjo’s Sauce, everything is about bringing people together over seriously good food.</p><strong>Come hungry. Leave happy.</strong></div></div></section>
      <section id="order" className="order-section" aria-labelledby="order-title"><div className="shell order-section-inner">
        <div><h2 id="order-title">Order Hanjo’s</h2><p>Choose DoorDash or Uber Eats to see delivery availability and place your order.</p></div>
        <DeliveryLinks primary/>
      </div></section>
      <section id="location" className="location light"><div className="shell split"><div>
        <p className="eyebrow">LOCATION & CONTACT</p><h2>FIND HANJO’S.</h2><p className="lead">Hanjo’s Smash Burger</p><address>41 Forum Shopping Center<br/>Chesterfield, MO 63017<br/>United States</address>
        <p><a href={restaurant.tel}>{restaurant.phone}</a></p><p>Halal certified{restaurant.outdoorSeating?' · Outdoor seating available':''}</p>
        {restaurant.hours.length>0&&<ul>{restaurant.hours.map(hours=><li key={hours}>{hours}</li>)}</ul>}
        <a className="button" href={directions} target="_blank" rel="noreferrer">Get Directions</a>
      </div><iframe title="Google map for Hanjo’s Smash Burger" loading="lazy" src={maps+'?q='+locationQuery+'&output=embed'} allowFullScreen/></div></section>
    </main>
    <footer><div className="shell footer-grid"><a href="#home"><img src="/logo.png" width="120" height="120" alt="Hanjo’s Smashed Burgers"/></a><div><strong>Hanjo’s Smash Burger</strong><p>{restaurant.address}</p><a href={restaurant.tel}>{restaurant.phone}</a> · <a href={directions}>Directions</a><p>Halal certified</p><div className="social-links" aria-label="Hanjo’s on social media">{restaurant.social.map(({label,href})=><a className="outline" key={href} href={href} target="_blank" rel="noopener noreferrer">{label}</a>)}</div></div><nav aria-label="Footer navigation">{nav.map(([label,id])=><a key={id} href={'#'+id}>{label}</a>)}<a href="#order">Order Now</a></nav><p className="closing">MADE FRESH. SMASHED PERFECTLY. MADE FOR YOU.</p></div></footer>
    <div className="sr-only" role="status">{message}</div>
    <dialog ref={dialog} className="drawer" aria-labelledby="cart-title" onClick={event=>{if(event.target===dialog.current){const bounds=dialog.current.getBoundingClientRect();if(event.clientX<bounds.left)dialog.current.close();}}}>
      <div className="drawer-head"><h2 id="cart-title">{panel==='cart'?'Your cart':'Checkout'}</h2><button className="outline" autoFocus onClick={()=>dialog.current.close()} aria-label="Close cart">✕</button></div>
      {panel==='checkout'?<div className="checkout">
        <p>Place your delivery order on DoorDash or Uber Eats. Re-add your items on the service you choose.</p>
        <DeliveryLinks/>
        <p><strong>Pickup location</strong><br/>{restaurant.address}</p>
        <div className="actions"><a className="button" href={restaurant.tel}>Call {restaurant.phone}</a><button className="outline" onClick={()=>setPanel('cart')}>Back to cart</button></div>
      </div>:<>
        {cart.length===0?<p>Your cart is empty.</p>:<ul className="cart-lines">{cart.map(line=><li key={line.id}>
          {line.selection?<div className="thumbnail"><Burger selection={line.selection}/></div>:line.image?<img src={photo(line.image)} alt=""/>:null}
          <div><h3>{line.name}</h3>{line.details&&<p>{line.details.join(' · ')}</p>}<p>{line.baseMissing?(line.cents?money(line.cents)+' priced extras each':'Price pending'):money(line.cents)+' each'}{!line.baseMissing&&line.pending?.length?' + pending':''}</p>
          <div className="line-actions"><button aria-label={'Decrease '+line.name+' quantity'} onClick={()=>changeQuantity(line.id,-1)}>−</button><span>{line.qty}</span><button aria-label={'Increase '+line.name+' quantity'} onClick={()=>changeQuantity(line.id,1)}>+</button>
          <button onClick={()=>setCart(previous=>previous.filter(item=>item.id!==line.id))}>Remove</button>
          {line.selection&&<a href="#builder" onClick={()=>{setSelection(line.selection);setEditing(line.id);dialog.current.close();}}>Edit</a>}</div></div>
        </li>)}</ul>}
        <dl className="totals"><div><dt>{incomplete?'Priced items subtotal':'Subtotal'}</dt><dd>{money(subtotal)}</dd></div>{cart.length>0&&tax!==null&&<div><dt>Tax</dt><dd>{money(tax)}</dd></div>}{cart.length>0&&fee!==null&&<div><dt>Fees</dt><dd>{money(fee)}</dd></div>}<div><dt>{incomplete?'Known total':'Total'}</dt><dd>{money(cart.length?total:0)}{incomplete?' + pending':''}</dd></div></dl>
        <div className="actions"><button className="button" disabled={!cart.length} onClick={()=>setPanel('checkout')}>Checkout</button><button className="outline" onClick={()=>dialog.current.close()}>Continue shopping</button></div>
      </>}
    </dialog>
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);


