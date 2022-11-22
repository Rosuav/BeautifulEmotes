import {choc, set_content, on, DOM} from "./factory.js";
const {A, BR, FIGCAPTION, FIGURE, H1, H3, IMG, P} = choc; //autoimport

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
	//const chan = await twitch("users?id=" + auth.channelId); //if needed (eg channel display name)
	const emotes = await twitch("chat/emotes?broadcaster_id=" + auth.channelId);
	//Code ported from Pike, see stillebot/modules/http/emotes.pike
	const sets = { };
	emotes.data.forEach(em => {
		if (em.emote_type == "bitstier") em.emote_set_id = "Bits"; //Hack - we don't get the bits levels anyway, so just group 'em.
		if (!sets[em.emote_set_id]) {
			let desc = "Unknown";
			switch (em.emote_type) {
				case "subscriptions": desc = "Tier " + em.tier[0]; break;
				case "follower": desc = "Follower"; break;
				case "bitstier": desc = "Bits"; break; //The actual unlock level is missing.
				default: break;
			}
			//As of 2022, only T1 sub emotes are ever animated, but if that ever changes, we'll be ready!
			if (em.format.includes("animated")) desc = "Animated " + desc;
			sets[em.emote_set_id] = [desc, []];
		}
		sets[em.emote_set_id][1].push([
			//Most emotes have the same image for static and default. Anims get a one-frame for static, and the animated for default.
			em.images.url_4x.replace("/static/", "/default/"),
			em.name,
		]);
	});
	//Also fetch the badges. They're intrinsically at a different size, but they'll be stretched to the same size.
	//If that's a problem, it'll need to be solved in CSS (probably with a classname on the figure here).
	const badges = await twitch("chat/badges?broadcaster_id=" + auth.channelId);
	badges.data.forEach(set => {
		let cur = { };
		if (set.set_id == "subscriber") {cur[1999] = cur[2999] = [];}
		set.versions.forEach(badge => {
			let desc = badge.id;
			if (set.set_id == "subscriber") {
				let tier = Math.floor(+badge.id / 1000);
				let tenure = +badge.id % 1000;
				desc = ["T1", 0, "T2", "T3"][tier];
				if (tenure) desc += ", " + tenure + " months";
				else desc += ", base";
			}
			cur[badge.id] = [badge.image_url_4x, desc];
		});
		//Flatten the sparse array (numerically keyed) into a simple array in the same order
		const b = Object.entries(cur).sort((a, b) => +a[0] < +b[0]).map(([k, v]) => v);
		if (set.set_id == "subscriber") sets[1<<29] = ["Subscriber badges", b];
		if (set.set_id == "bits") sets[1<<30] = ["Bits badges", b];
	});
	const emotesets = Object.entries(sets).sort((a, b) => (a[0]|0) - (b[0]|0)).map(([k, v]) => v);
	if (!emotesets.length) emotesets = ["None", ["No emotes found for this channel. Partnered and affiliated channels have emote slots available; emotes awaiting approval may not show up here."]];
	set_content("main", [
		H1("Emotes are Beautiful!"),
		P(A({
			href: "https://sikorsky.rosuav.com/emotes?broadcaster=" + auth.channelId,
			target: "_blank",
		}, "Pop out - enlarge - enhance!")),
		emotesets.map(([lbl, set]) => [
			H3(lbl),
			set.map(em => em.length
				? FIGURE([IMG({src: em[0], alt: "", title: em[1]}), FIGCAPTION(em[1])])
				: BR() //Hack: Insert line breaks after sub badge tiers
			),
		]),
	]);
});
Twitch.ext.onContext(ctx => {
	document.body.dataset.theme = ctx.theme; //usually "light" or "dark"
});
