([
    { p : [ 'Call yak.paste with a ', { strong : 'filename' }, ':' ]}
    , yak.isBrowser ? { pre : { code : document.getElementById( 'yak-paste-filename' ).textContent } } : ''
    , { p : 'En grande avant-premi&egrave;re, le code source de YAK:' }
    , { 'pre style="padding: 16px; border: solid 1px black; min-width: 600px;"' : { code : yak.read( 'yak.js' ) } }
])