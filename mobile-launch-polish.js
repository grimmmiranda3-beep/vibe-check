// Vibe Check — launch-focused mobile polish
(function(){
  'use strict';
  function init(){
    if(document.getElementById('vibeCheckMobileLaunchPolish')) return;
    const style=document.createElement('style');
    style.id='vibeCheckMobileLaunchPolish';
    style.textContent=`
      @media(max-width:850px){
        .top{padding-left:14px;padding-right:14px}
        .brand{font-size:20px}
        .brand .logo{width:40px;height:40px}
        .hero h1{letter-spacing:-.03em}
        .search input{min-width:0;font-size:16px}
        .filters{scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:14px}
        .filters::-webkit-scrollbar{display:none}
        .chip{min-height:42px;padding:10px 14px}
        .place{border-radius:18px}
        .photo-wrap{height:190px}
        .place-body{padding:14px}
        .place-actions{gap:9px}
        .small-btn{min-height:44px;padding:11px 8px}
        .modal{padding:10px;align-items:end}
        .modal-card{width:100%;max-height:92vh;border-radius:24px 24px 12px 12px;padding:20px 16px calc(24px + env(safe-area-inset-bottom))}
        .modal-photo{height:210px;margin:12px 0}
        .modal h2{font-size:23px;padding-right:38px}
        .bigscore{font-size:40px}
        .emoji-row{gap:6px;margin:14px 0}
        .emoji{min-height:58px;padding:10px 4px;border-radius:15px;font-size:23px}
        .primary{min-height:48px;margin-top:16px}
        .score-row{grid-template-columns:90px 1fr 40px;gap:7px}
        .community-count{padding:8px 10px}
        #mobileBusinessBar{padding-left:4px;padding-right:4px}
        #mobileBusinessBar button{min-height:58px}
        #mobileBusinessBar button:active{transform:scale(.98)}
        body{overscroll-behavior-x:none}
      }
      @media(max-width:380px){
        .hero h1{font-size:32px}
        .emoji{font-size:21px}
        .emoji-row{gap:4px}
        .small-btn{font-size:13px}
      }
    `;
    document.head.appendChild(style);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
