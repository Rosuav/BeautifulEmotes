import {choc, set_content, on, DOM} from "https://rosuav.github.io/choc/factory.js";
const {H1, P} = choc; //autoimport
set_content("main", [
	H1("Config page"),
	P("Configuration goes here"),
]);
