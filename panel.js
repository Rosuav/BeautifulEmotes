import {choc, set_content, on, DOM} from "https://rosuav.github.io/choc/factory.js";
const {B} = choc; //autoimport

let auth = null;
async function twitch(url, args) {
	args = args || { };
	args.headers = args.headers || { };
	args.headers["client-id"] = auth.clientId;
	args.headers.authorization = "Extension " + auth.helixToken;
	return await (await fetch("https://api.twitch.tv/helix/" + url, args)).json();
}
Twitch.ext.onAuthorized(async a => {
	//If you could get a JSON Web Security Token, how far from this planet would you throw it? Just curious.
	auth = a;
	console.log("Hello, " + a.userId);
	console.log("I am " + a.channelId);
	const self = await twitch("users?id=" + auth.channelId);
	set_content("main p", [
		"Welcome to Channel ",
		B(self.data[0].display_name),
	]);
	
});
