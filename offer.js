// lexfall.app/offer (win-back email, 2026-11-18): opens the app on the discounted plan
// (vorto://paywall?offer=exit). Android uses an intent link that falls back to Google Play.
(function () {
  var ua = navigator.userAgent || '';
  var android = /Android/i.test(ua);
  var ios = /iPhone|iPad|iPod/i.test(ua);
  var open = document.getElementById('open');
  var link = 'vorto://paywall?offer=exit';
  if (android) {
    link = 'intent://paywall?offer=exit#Intent;scheme=vorto;package=com.gpeysack.lexfall;' +
      'S.browser_fallback_url=' + encodeURIComponent('https://play.google.com/store/apps/details?id=com.gpeysack.lexfall') + ';end';
    open.href = link;
  }
  if (!android && !ios) {
    document.getElementById('msg').textContent = 'Open this link on your phone to see the offer in the Lexfall app.';
    return;
  }
  setTimeout(function () { window.location.href = link; }, 300);
})();
