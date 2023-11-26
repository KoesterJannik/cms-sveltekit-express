<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { BlogPost } from '../../../types';
	import { PUBLIC_USER_ID, PUBLIC_BACKEND_URL } from '$env/static/public';
	const ID = $page.params.id;

	let singleBlogPost: BlogPost | undefined = undefined;
	onMount(async () => {
		const res = await fetch(`${PUBLIC_BACKEND_URL}/rest/projects/${PUBLIC_USER_ID}/${ID}`);

		const json = await res.json();
		console.log(json);
		singleBlogPost = json;
	});
</script>

<pre>
    {JSON.stringify(singleBlogPost, null, 2)}
</pre>
