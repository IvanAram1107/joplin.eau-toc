import joplin from 'api';

const slugs = {};

function convertToSlug(text: string): string {
	const converted = text.toLowerCase().trim()
		.replace(/ +/g, "-")
		.replace(/[^A-Za-z0-9ñÑáÁéÉíÍóÓúÚüÜ-]+/g, '');
	let num = slugs[converted] || 1;
	slugs[converted] = num + 1;
	return num > 1 ? `${converted}-${num}` : converted;
}

function getHeaders(body: string) {
	const headers = [];
	const lines = body.split('\n');
	for (const line of lines) {
			const match = line.match(/^#(#+)\s(.*)*/);
			if (!match || match[2] === "TOC") continue;
			headers.push({
				level: match[1].length - 1,
				text: match[2],
			});
	}
	return headers;
}

async function insertToc() {
	const note = await joplin.workspace.selectedNote();
	if(!note) return;
	const cursor = await joplin.commands.execute('editor.execCommand', {
		name: 'getCursor', args: [], ui: false, value: null,
	});
	const headers = getHeaders(note.body);
	const newLines = [
		"\n## TOC\n", 
		...headers.map(h => "  " + `${'  '.repeat(2 * h.level)}* [${h.text}](#${convertToSlug(h.text)})`)
	];
	const bodyLines = note.body.split("\n");
	bodyLines.splice(cursor.line, 0, ...newLines);
	await joplin.data.put(["notes", note.id], null, { body: bodyLines.join("\n") });
}


joplin.plugins.register({
	onStart: async function() {
		await joplin.commands.register({
			name: 'eauInsertToc',
			label: 'Eau - Insert Table of Contents',
			iconName: 'fas fa-list',
			execute: async () => await insertToc()
		})
	}
});
