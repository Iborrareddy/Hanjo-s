export const restaurant = {
  phone: '(314) 392-9135', tel: 'tel:+13143929135',
  address: '41 Forum Shopping Center, Chesterfield, MO 63017',
  hours: [], outdoorSeating: true,
  delivery: [
    {label: 'DoorDash', logo: '/doordash-logo.svg', href: 'https://www.doordash.com/store/hanjos-smash-burgers-chesterfield-46869471/113521149/'},
    {label: 'Uber Eats', logo: '/uber-eats-logo.svg', href: 'https://www.ubereats.com/store/hanjos-smash-burger-41-forum-shopping-ctr/KBEGnx6XQMuTO_joApyp7g'}
  ],
  social: [
    {label: 'Facebook', href: 'https://www.facebook.com/p/Hanjos-Smash-Burgers-61583546750922/'},
    {label: 'Instagram', href: 'https://www.instagram.com/hanjossmashedburgers/'}
  ],
  taxRate: null, feeCents: null
};
export const maps = 'https://www.google.com/maps';
export const locationQuery = encodeURIComponent(restaurant.address);
export const directions = maps + '/dir/?api=1&destination=' + locationQuery;
export const menu = [
  ['Fan Favorites', [['Chopped Cheese Fries',1500,'fries'],["Hanjo’s Dirty Tots",1500,'tots']]],
  ['Burgers', [
    ['Hanjo’s Smashburger', 1300, 'hero'],
    ['Classic Smashburger (Single)', 900, 'classic-single'],
    ['Classic Smashburger (Double)', 1200, 'classic-double'],
    ['B.L.T.', 1000, 'blt'],
    ['Hanjo’s Royale Burger', 1400, 'royale'],
    ['Little Hanjo’s Burger', 700, 'little-hanjos'],
    ['The Oklahoma Burger', 1200, 'oklahoma'],
    ['Patty Melt Burger', 1200, 'patty-melt'],
    ['Frisco Melt', 1300, 'frisco-melt'],
    ['Grilled Cheese', 600, 'grilled-cheese']
  ]],
  ['Hot Dogs', [['Chicago Dog',700,'dog']]],
  ['Sides', [
    ['French Fries', 400, 'sides'],
    ['Tater Tots', 400, 'tater-tots'],
    ['Onion Rings', 500, 'onion-rings'],
    ['Cheese Curds', 500, 'cheese-curds']
  ]],
  ['Shakes', [
    ['Heath', 'heath-shake'],
    ['Strawberry', 'shake'],
    ['Kit Kat', 'kit-kat-shake'],
    ['Fruity Pebbles', 'fruity-pebbles-shake'],
    ['M&M', 'mm-shake'],
    ['Oreo', 'oreo-shake'],
    ['Chocolate', 'chocolate-shake'],
    ['Reese', 'reese-shake'],
    ['Vanilla', 'vanilla-shake']
  ].map(([name, image]) => [name + ' Shake', 700, image])],
  ['Desserts', [['Vanilla Mini Cone',300]]],
  ['Drinks', [
    ['Plastic Water Bottle 16.9 oz', 149, 'bottled-water'],
    ['Glass Bottled Beverages 12 oz', 400, 'glass-bottle'],
    ['Canned Drinks 7.5 oz', 199, 'mini-can'],
    ['Canned Drinks 12 oz', 249, 'standard-can']
  ]],
  ['Add-ons', [
    ['Fried Egg', 200, 'fried-egg'],
    ['Beef Bacon', 300, 'beef-bacon'],
    ['Extra Cheese', 100, 'extra-cheese'],
    ['Extra Patty', 300, 'extra-patty']
  ]]
].map(([category, entries]) => [category, entries.map(([name,cents,image,description]) => ({name,cents,image,description}))]);

const option = (name, cents = null) => ({name,cents});
export const groups = [
  {key:'bun',label:'Bun', options:[option('Classic Sesame Bun',0),option('Potato Bun'),option('Brioche Bun')]},
  {key:'patty',label:'Patty',base:true, options:[option('Single Smash',900),option('Double Smash',1200),option('Triple Smash')]},
  {key:'cheese',label:'Cheese',options:[option('American Cheese',0),option('Cheddar'),option('No Cheese',0)]},
  {key:'toppings',label:'Toppings',multiple:true,options:['Lettuce','Tomato','Pickles','Onions','Jalapeños'].map(name=>option(name))},
  {key:'sauce',label:'Sauces',multiple:true,options:["Hanjo’s Signature Sauce",'Mayo','Spicy Sauce','BBQ Sauce'].map(name=>option(name))},
  {key:'extras',label:'Extras',multiple:true,options:[option('Extra Patty',300),option('Extra Cheese',100),option('Extra Sauce'),option('Crispy Beef Bacon',300)]}
];
export const defaults = {bun:'Classic Sesame Bun',patty:'Double Smash',cheese:'American Cheese',toppings:[],sauce:[],extras:[]};
export function quote(selection) {
  const choices = groups.flatMap(({key,options}) => options.filter(({name}) => [selection[key]].flat().includes(name)));
  const pending = choices.filter(({cents})=>cents === null).map(({name})=>name);
  const baseMissing = groups.find(group=>group.base).options.find(opt=>opt.name === selection.patty)?.cents == null;
  return {cents:choices.reduce((sum,opt)=>sum+(opt.cents ?? 0),0),pending,baseMissing, details:choices.map(opt=>opt.name)};
}
export const money = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
