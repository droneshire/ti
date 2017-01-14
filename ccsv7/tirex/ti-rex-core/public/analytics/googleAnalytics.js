var currentPageUrlIs = "";

if (typeof this.href != "undefined") {
     currentPageUrlIs = this.href.toString().toLowerCase();
}else{
     currentPageUrlIs = document.location.toString().toLowerCase();
}


if (currentPageUrlIs.indexOf("dev.ti.com") > -1) {
	(function(i,s,o,g,r,a,m) {
	  i['GoogleAnalyticsObject']=r;
	  i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();
	  a=s.createElement(o),m=s.getElementsByTagName(o)[0];
	  a.async=1;
	  a.src=g;
	  m.parentNode.insertBefore(a,m)
	 })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

	ga('create', 'UA-62823528-1', 'auto');
	ga('send', 'pageview');
}