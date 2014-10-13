[].forEach.call( document.getElementsByTagName( 'button' ), function (btn_node) { btn_node.removeAttribute( 'disabled' ); } );
window.ontouchstart = function () { Array.prototype.forEach.call( document.getElementsByClassName( "anchor" ), function (node) { node.className = node.className.replace( /\banchor\b/g, '' ); } ); };
