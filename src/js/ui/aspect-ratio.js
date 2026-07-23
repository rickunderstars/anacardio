(function () {
	var dismissed = false;
	var warning = document.getElementById("aspect-ratio-warning");
	var dismiss = document.getElementById("aspect-ratio-dismiss");
	function check() {
		if (dismissed) return;
		if (window.innerWidth / window.innerHeight < 11 / 9) {
			warning.classList.remove("hidden");
		} else {
			warning.classList.add("hidden");
		}
	}
	dismiss.addEventListener("click", function (e) {
		e.preventDefault();
		dismissed = true;
		warning.classList.add("hidden");
	});
	check();
	window.addEventListener("resize", check);
})();
