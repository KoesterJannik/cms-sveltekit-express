<script lang="ts">
	import { onMount } from 'svelte';
	import type { BlogPost } from '../../types';
	import { PUBLIC_USER_ID, PUBLIC_BACKEND_URL } from '$env/static/public';

	let blogPosts: BlogPost[] = [];
	onMount(async () => {
		const res = await fetch(`${PUBLIC_BACKEND_URL}/rest/projects/${PUBLIC_USER_ID}`);

		const json = await res.json();
		console.log(json);
		blogPosts = json;
	});
</script>

This is our blog

{#each blogPosts as post}
	<div class="card">
		<h1>
			{post.name}
		</h1>
		<p>
			{post.description}
		</p>
		<a href="/blog/{post.id}">Read more</a>
	</div>
{/each}
