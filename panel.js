import {choc, set_content, on, DOM} from "https://rosuav.github.io/choc/factory.js";
const {B} = choc; //autoimport
set_content("main p", [
	"Hello, ",
	B("world"),
]);
