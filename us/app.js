(() => {
 const EN = document.documentElement.lang === 'en';
 const T = EN
  ? {open: 'Open menu', close: 'Close menu', behind: n => `${n} hr behind Eastern`, pick: 'Please choose your time zone.', locale: 'en-US',
     msgs: {type: 'Please choose an inquiry type.', name: 'Please enter your name.', email: 'Please check your email address (e.g. hanako@example.com).', tz: 'Please choose your time zone.', message: 'Please tell us what you would like to discuss.', agree: 'Please agree to the privacy terms.'}}
  : {open: 'メニューを開く', close: 'メニューを閉じる', behind: n => `東部より${n}時間遅い`, pick: 'お住まいの地域の時間帯をお選びください。', locale: 'ja-JP',
     msgs: {type: 'お問い合わせの種類を選択してください。', name: 'お名前を入力してください。', email: 'メールアドレスの形式をご確認ください（例：hanako@example.com）。', tz: 'お住まいの時間帯を選択してください。', message: 'ご相談内容を入力してください。', agree: '個人情報の取り扱いへの同意が必要です。'}};
 // メニュー
 const btn = document.querySelector('.menu-btn');
 const menu = document.getElementById('sp-menu');
 const sticky = document.querySelector('.sticky-cta');
 const setMenu = open => {
  menu.hidden = !open;
  btn.setAttribute('aria-expanded', open);
  btn.querySelector('.vh').textContent = open ? T.close : T.open;
  updateSticky();
 };
 btn.addEventListener('click', () => setMenu(menu.hidden));
 addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); btn.focus(); } });
 matchMedia('(min-width:1200px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

 // 下部の固定ボタン（スマホ）：ファーストビューを過ぎてから表示
 function updateSticky() {
  if (!sticky) return;
  sticky.classList.toggle('show', scrollY > 480 && menu.hidden);
 }
 if (sticky) { document.body.classList.add('has-sticky'); addEventListener('scroll', updateSticky, {passive: true}); updateSticky(); }

 // 時刻帯：日本と米国各地の現在時刻、日本との時差
 const clocks = [...document.querySelectorAll('.clock[data-tz]')];
 const offsetOf = (tz, d) => {
  const s = new Intl.DateTimeFormat('en-US', {timeZone: tz, timeZoneName: 'shortOffset'}).formatToParts(d).find(p => p.type === 'timeZoneName').value;
  const m = s.match(/GMT([+-]\d+)?(?::(\d+))?/);
  return m && m[1] ? Number(m[1]) + (m[2] ? Math.sign(Number(m[1])) * Number(m[2]) / 60 : 0) : 0;
 };
 const tick = () => {
  const now = new Date();
  const et = offsetOf('America/New_York', now);
  clocks.forEach(el => {
   const tz = el.dataset.tz;
   el.querySelector('b').textContent = new Intl.DateTimeFormat(T.locale, {timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false}).format(now);
   const date = new Intl.DateTimeFormat(T.locale, {timeZone: tz, month: EN ? 'short' : 'numeric', day: 'numeric', weekday: 'short'}).format(now);
   const diff = et - offsetOf(tz, now);
   el.querySelector('small').textContent = diff ? `${date}${EN ? ' · ' : '・'}${T.behind(diff)}` : date;
  });
 };
 if (clocks.length) { tick(); setInterval(tick, 30000); }

 // お問い合わせフォーム（デモ：送信はせず、入力チェックと受付表示のみ）
 const form = document.getElementById('us-form');
 if (form) {
  const tzSel = document.getElementById('f-tz');
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const map = {'America/Los_Angeles': 1, 'America/Vancouver': 1, 'America/Denver': 2, 'America/Phoenix': 2, 'America/Chicago': 3, 'America/New_York': 4, 'America/Detroit': 4, 'America/Anchorage': 5, 'Pacific/Honolulu': 6};
  if (map[local]) tzSel.selectedIndex = map[local];
  else tzSel.closest('.field').querySelector('.hint').textContent = T.pick;

  const msgs = T.msgs;
  const showError = (el, text) => {
   const field = el.closest('.field');
   let err = field.querySelector('.err');
   if (text) {
    if (!err) { err = document.createElement('p'); err.className = 'err'; err.id = el.id + '-err'; field.appendChild(err); }
    err.textContent = text; field.setAttribute('data-invalid', ''); el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', err.id);
   } else if (err) { err.remove(); field.removeAttribute('data-invalid'); el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
  };
  const check = el => {
   const bad = el.type === 'checkbox' ? !el.checked : el.type === 'email' ? !/^\S+@\S+\.\S+$/.test(el.value) : !el.value.trim();
   showError(el, bad ? msgs[el.name] : '');
   return !bad;
  };
  form.querySelectorAll('[required]').forEach(el => el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'blur', () => { if (el.closest('[data-invalid]') || el.value) check(el); }));
  form.addEventListener('submit', e => {
   e.preventDefault();
   const invalid = [...form.querySelectorAll('[required]')].filter(el => !check(el));
   if (invalid.length) { invalid[0].focus(); return; }
   form.hidden = true;
   const sent = document.getElementById('us-sent');
   sent.hidden = false; sent.focus(); sent.scrollIntoView({block: 'center'});
  });
 }
 // ローディング：初回のみ。フォントが揃ってから閉じる（最短0.9秒）
 const loader = document.getElementById('rm-loader');
 if (loader && document.documentElement.classList.contains('show-loader')) {
  const t0 = performance.now();
  const close = () => setTimeout(() => { loader.classList.add('is-done'); try { sessionStorage.setItem('rm-seen', '1'); } catch (e) {} setTimeout(() => loader.remove(), 600); }, Math.max(0, (window.__rmSeen ? 800 : 2600) - (performance.now() - t0)));
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 3000))]).then(close);
 } else if (loader) loader.remove();

 // セクションのフェード（ファーストビュー以外）
 if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {rootMargin: '0px 0px -8% 0px'});
  document.querySelectorAll('main > section:not(:first-child), .to-main, .site-footer').forEach(el => { el.classList.add('rv'); io.observe(el); });
 }
})();
