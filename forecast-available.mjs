// Original city4dab10 for material goods. Reservations can exceed stock.
export function forecastAvailable({stock,reserved}) {
 if(!Number.isInteger(stock)||stock<0||stock>32767||!Number.isInteger(reserved)||reserved<0||reserved>2147483647)throw Error('Invalid available goods inputs');
 return (stock-reserved)|0;
}
