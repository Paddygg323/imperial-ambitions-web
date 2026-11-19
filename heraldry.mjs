// Original enamel-style emblems for presentation; country names remain visible.
// These are identification marks, not a claim to reproduce historical coats of arms.
const marks={
 england:'<path d="M17 10v21M8 19h18" stroke="#fff0cd" stroke-width="5"/>',
 france:'<path d="M17 9c-6 6-5 9-2 12-7-9-13-1-5 3 1-4 4-1 5 1l-3 4h10l-3-4c1-2 4-5 5-1 8-4 2-12-5-3 3-3 4-6-2-12Z" fill="#ffe097"/>',
 sweden:'<path d="M14 9v23M7 18h21" stroke="#ffe097" stroke-width="4"/>',
 holland:'<path d="M8 13h18M8 20h18M10 27h14" stroke="#fff0cd" stroke-width="4"/>',
 portugal:'<path d="M15 11h4v5h-4zM9 18h4v5H9zM21 18h4v5h-4zM15 18h4v5h-4zM15 25h4v5h-4z" fill="#fff0cd" stroke="#d3ae61" stroke-width=".5"/>',
 spain:'<path d="M9 29V15h4v4h3V12h3v7h3v-4h4v14ZM15 29v-6h5v6" fill="none" stroke="#fff0cd" stroke-width="2"/>'
};
export function nationEmblem(id,color='#a18d61'){
 const safe=/^#[0-9a-f]{3,8}$/i.test(color)?color:'#a18d61';
 const mark=marks[id]??'<path d="M17 11v18M11 14l6 5 6-5M11 21l6 5 6-5" fill="none" stroke="#fff0cd" stroke-width="2"/>';
 return `<svg class="nation-emblem" viewBox="0 0 34 40" aria-hidden="true" focusable="false"><path d="M3 3h28v20q0 9-14 15Q3 32 3 23Z" fill="#805422" stroke="#573513" stroke-width="2"/><path d="M5 5h24v17q0 8-12 13Q5 30 5 22Z" fill="${safe}" stroke="#ffe29a" stroke-width="2"/>${mark}<path d="M6 6h22v6H6Z" fill="#fff9db" opacity=".15"/></svg>`;
}
