// Keep this loader compatible with older WebViews so an unsupported runtime
// gets useful instructions instead of an empty, unresponsive map.
(function () {
 var supported = typeof window.structuredClone === 'function' &&
  typeof window.ResizeObserver === 'function' && typeof window.TextEncoder === 'function' &&
  typeof Array.prototype.at === 'function' && typeof HTMLDialogElement !== 'undefined' &&
  typeof HTMLDialogElement.prototype.showModal === 'function' && window.CSS && CSS.supports('selector(:has(*))');
 var ready = false, failed = false;
 var box = document.createElement('section'); box.id = 'startupStatus';box.setAttribute('role','status');
 var title = document.createElement('h1');title.textContent = 'Preparing your campaign';box.appendChild(title);
 var message = document.createElement('p');message.textContent = 'Opening the atlas and loading your saved orders…';box.appendChild(message);
 var retry = document.createElement('button');retry.textContent = 'Try again';retry.hidden = true;retry.onclick = function () {location.reload();};box.appendChild(retry);
 document.body.appendChild(box);
 function fail(text) {if (ready) return;failed = true;title.textContent = 'The game could not open';message.textContent = text + ' Your saved campaign has not been replaced.';retry.hidden = false;box.setAttribute('role','alert');}
 window.addEventListener('game-ready',function () {ready = true;box.remove();});
 window.addEventListener('error',function () {fail('A required game file could not load. Close and reopen the game; if this continues, update the app without uninstalling it or clearing its data.');});
 window.addEventListener('unhandledrejection',function () {fail('Opening the campaign was interrupted. Try again.');});
 if (!supported) {fail('Update Android System WebView and Chrome through Google Play, or use an up-to-date browser. This version needs newer browser features.');return;}
 var script = document.createElement('script');script.type = 'module';script.src = 'app.mjs';script.onerror = function () {fail('A required game file is missing. Try again or restore a complete app installation.');};document.body.appendChild(script);
 window.setTimeout(function () {if (!ready && !failed) message.textContent = 'The first load is taking longer than usual. Please leave the game open while the atlas is prepared.';},15000);
}());
