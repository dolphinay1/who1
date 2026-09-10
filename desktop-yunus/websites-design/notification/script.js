const main = document.querySelector("#main");
const elems = document.querySelectorAll(".notification");

const getTop = el => {
	const before = el.querySelector(".before");
	const after = el.querySelector(".after");
	let viewportOffset = el.getBoundingClientRect();
	let elemTop = viewportOffset.top;
	before.style.top = "-" + elemTop + "px";
	after.style.top = "-" + elemTop + "px";
}

const lightToDark = () => {
	const tl = new TimelineMax();
	const groups = ["#one", "#two", "#three"];
	tl
		.set(".before", {opacity:0})
		.set(groups, {opacity:0,y:60})
		.to(main, 0.5, {opacity:1})
		.staggerTo(groups, 0.5, {opacity:1,ease:Power3.easeOut}, 0.2)
		.staggerTo(groups, 1, {y:0,ease:Power3.easeOut}, 0.2, '-=1')
		.to(".before", 2, {opacity:1})
		.to(".after", 2, {opacity:0}, '-=1')
		.to(".notification", 0.25, {color:"#1b1e29"}, '-=3')
		.to(".notification", 1.75, {color:"white"}, '-=2.75')
		.to(".one .notification", 1, {backgroundColor:"rgba(17,19,26,0.6)"}, '-=3')
		.to(".one .notification", 1, {backgroundColor:"rgba(0,0,0,0.5)"}, '-=2.5')
		.to(".two .notification", 1, {backgroundColor:"rgba(17,19,26,0.5)"}, '-=3')
		.to(".two .notification", 1, {backgroundColor:"rgba(0,0,0,0.4)"}, '-=2.5')
		.to(".three .notification", 1, {backgroundColor:"rgba(17,19,26,0.4)"}, '-=3')
		.to(".three .notification", 1, {backgroundColor:"rgba(0,0,0,0.3)"}, '-=2.5')
	;
}

imagesLoaded(main, {background:true}, () => {
	elems.forEach(el => {
		getTop(el);
		window.addEventListener("resize", function() {
			setTimeout(() => {
				getTop(el);
			}, 250);
		});
	});
	window.requestAnimationFrame(lightToDark);
});