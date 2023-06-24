document.querySelector(".menu").addEventListener("click", ()=>{
  document.querySelector(".nav-links").classList.remove("hidden"),
  document.querySelector(".menu").classList.toggle("hidden")
  document.querySelector(".menu-close").classList.remove("hidden")
}
);

document.querySelector(".menu-close").addEventListener("click", ()=>{
  document.querySelector(".nav-links").classList.toggle("hidden"),
  document.querySelector(".menu-close").classList.toggle("hidden")
  document.querySelector(".menu").classList.remove("hidden")
}
);