/* Social sharing for articles, news, photos and videos.
   Uses canonical URLs, native sharing where supported, and clipboard fallback. */
(function(){
  "use strict";
  var root=document.documentElement;
  var labels={
    bn:{label:"শেয়ার করুন",facebook:"Facebook",whatsapp:"WhatsApp",x:"X",copy:"লিংক কপি করুন",native:"শেয়ার",copied:"লিংক কপি হয়েছে",failed:"লিংক কপি করা যায়নি"},
    en:{label:"Share",facebook:"Facebook",whatsapp:"WhatsApp",x:"X",copy:"Copy link",native:"Share",copied:"Link copied",failed:"Could not copy link"},
    ur:{label:"شیئر کریں",facebook:"Facebook",whatsapp:"WhatsApp",x:"X",copy:"لنک کاپی کریں",native:"شیئر",copied:"لنک کاپی ہو گیا",failed:"لنک کاپی نہیں ہو سکا"},
    ar:{label:"مشاركة",facebook:"Facebook",whatsapp:"WhatsApp",x:"X",copy:"نسخ الرابط",native:"مشاركة",copied:"تم نسخ الرابط",failed:"تعذر نسخ الرابط"}
  };
  var toast;
  var toastTimer;
  function language(){var l=(root.lang||"bn").toLowerCase();return labels[l]?l:"bn";}
  function pageUrl(){var c=document.querySelector('link[rel="canonical"]');return c&&c.href?c.href:window.location.href.split("#")[0];}
  function absoluteUrl(value){try{return new URL(value,pageUrl()).href;}catch(e){return pageUrl();}}
  function getToast(){if(toast)return toast;toast=document.createElement("div");toast.className="shareToast";toast.setAttribute("role","status");toast.setAttribute("aria-live","polite");document.body.appendChild(toast);return toast;}
  function notify(ok){var t=getToast();t.textContent=labels[language()][ok?"copied":"failed"];t.classList.add("is-visible");window.clearTimeout(toastTimer);toastTimer=window.setTimeout(function(){t.classList.remove("is-visible");},2600);}
  function copyText(value){if(navigator.clipboard&&window.isSecureContext){return navigator.clipboard.writeText(value).then(function(){return true;}).catch(function(){return fallbackCopy(value);});}return Promise.resolve(fallbackCopy(value));}
  function fallbackCopy(value){try{var field=document.createElement("textarea");field.value=value;field.setAttribute("readonly","");field.style.position="fixed";field.style.opacity="0";field.style.pointerEvents="none";document.body.appendChild(field);field.select();field.setSelectionRange(0,field.value.length);var ok=document.execCommand("copy");field.remove();return ok;}catch(e){return false;}}
  function makeBar(title,url,kind){
    var bar=document.createElement("div");bar.className="shareBar";bar.dataset.shareKind=kind||"article";
    var text=document.createElement("span");text.className="shareLabel";bar.appendChild(text);
    var encodedUrl=encodeURIComponent(url);
    var shareText=title||document.title;
    var encodedText=encodeURIComponent(shareText);
    function anchor(cls,label,href){var a=document.createElement("a");a.className="shareAction "+cls;a.textContent=label;a.href=href;a.target="_blank";a.rel="noopener noreferrer";a.setAttribute("aria-label",label);bar.appendChild(a);}
    anchor("facebook","f  "+labels[language()].facebook,"https://www.facebook.com/sharer/sharer.php?u="+encodedUrl);
    anchor("whatsapp","◉  "+labels[language()].whatsapp,"https://wa.me/?text="+encodeURIComponent(shareText+" "+url));
    anchor("xshare","𝕏  "+labels[language()].x,"https://twitter.com/intent/tweet?text="+encodedText+"&url="+encodedUrl);
    var copy=document.createElement("button");copy.type="button";copy.className="shareAction copy";copy.textContent="↗  "+labels[language()].copy;copy.addEventListener("click",function(){Promise.resolve(copyText(url)).then(notify);});bar.appendChild(copy);
    if(typeof navigator.share==="function"){var nativeButton=document.createElement("button");nativeButton.type="button";nativeButton.className="shareAction native";nativeButton.textContent="↗  "+labels[language()].native;nativeButton.addEventListener("click",function(){navigator.share({title:shareText,text:shareText,url:url}).catch(function(){});});bar.appendChild(nativeButton);}
    bar._refresh=function(){var l=labels[language()];text.textContent=l.label;var items=bar.querySelectorAll(".shareAction");items[0].textContent="f  "+l.facebook;items[1].textContent="◉  "+l.whatsapp;items[2].textContent="𝕏  "+l.x;items[3].textContent="↗  "+l.copy;if(items[4])items[4].textContent="↗  "+l.native;};
    bar._refresh();return bar;
  }
  function titleFrom(el){var h=el.querySelector("h1,h2,h3");return h?(h.getAttribute("data-"+language())||h.textContent.trim()):document.title;}
  function addArticleShare(){
    var article=document.querySelector("main article.article, main article.statement");
    if(article&&!article.querySelector(":scope > .shareBar")){
      var heading=article.querySelector("h1,h2");var meta=article.querySelector(".meta");
      var title=heading?(heading.getAttribute("data-"+language())||heading.textContent.trim()):document.title;
      article.insertBefore(makeBar(title,pageUrl(),"article"),meta?meta.nextSibling:(heading?heading.nextSibling:article.firstChild));
    }
  }
  function addCardShares(){
    var cards=new Set();
    document.querySelectorAll(".article-card,.newsFeature").forEach(function(card){cards.add(card);});
    cards.forEach(function(card){
      if(card.querySelector(":scope > .shareBar,.shareBar"))return;
      var link=card.querySelector('h2 a[href],h3 a[href],a.newsFeatureLink[href],a[href*="/blog/"],a[href*="/news-and-press/"]');
      if(!link)return;
      var url=absoluteUrl(link.getAttribute("href"));var title=link.getAttribute("data-"+language())||link.textContent.trim()||document.title;
      var bar=makeBar(title,url,"article-card");
      var target=card.querySelector(".meta")||card.lastElementChild||card;
      target.insertAdjacentElement("afterend",bar);
    });
  }
  function addGalleryShares(){
    var index=0;
    document.querySelectorAll("figure").forEach(function(item){
      if(item.querySelector(".shareBar"))return;
      var caption=item.querySelector("figcaption");var img=item.querySelector("img");var video=item.querySelector("video");
      if(!img&&!video)return;
      index++;if(!item.id)item.id="media-"+index;
      var title=caption?(caption.getAttribute("data-"+language())||caption.textContent.trim()):(img?(img.alt||"Photo"): "Video");
      var url=pageUrl().split("#")[0]+"#"+item.id;
      var bar=makeBar(title,url,"media");
      (caption||item).insertAdjacentElement("afterend",bar);
    });
    document.querySelectorAll("video,iframe[src*='youtube'],iframe[src*='vimeo']").forEach(function(media){
      var holder=media.closest("figure")||media.parentElement;
      if(!holder||holder.querySelector(".shareBar"))return;
      var title=media.getAttribute("title")||media.getAttribute("aria-label")||"Video";
      var id=holder.id||("video-"+(++index));holder.id=id;
      holder.appendChild(makeBar(title,pageUrl().split("#")[0]+"#"+id,"media"));
    });
  }
  function refresh(){document.querySelectorAll(".shareBar").forEach(function(bar){if(bar._refresh)bar._refresh();});}
  function init(){addArticleShare();addCardShares();addGalleryShares();refresh();if(window.MutationObserver){var observer=new MutationObserver(function(){refresh();});observer.observe(root,{attributes:true,attributeFilter:["lang"]});}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();