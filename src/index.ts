import joplin from 'api';

const slugs = {};

function convertToSlug(text: string): string {
	const converted = text.toLowerCase().trim().replace(/ +/g, "-").replace(/[^A-Za-z0-9-]+/g, '');
	let num = slugs[converted] || 1;
	slugs[converted] = num + 1;
	return num > 1 ? `${converted}-${num}` : converted;
}

function getHeaders(body: string) {
	const headers = [];
	const lines = body.split('\n');
	for (const line of lines) {
			const match = line.match(/^(#+)\s(.*)*/);
			if (!match) continue;
			headers.push({
				level: match[1].length - 1,
				text: match[2],
			});
	}
	return headers;
}

async function insertToc() {
	const note = await joplin.workspace.selectedNote();
	if(!note){
		throw new TypeError("No note selected, table of contents cannot be created.");
	}
	const headers = getHeaders(note.body);
	const newLines = [];
	for (const header of headers) {
		const slug = convertToSlug(header.text);
		newLines.push("  ".repeat(2 * header.level) + `* [${header.text}](${slug})`)
	}
	const cursor = await joplin.commands.execute('editor.execCommand', {
		name: 'getCursor',
		args: [],
		ui: false,
		value: null,
	});
	console.info("CUUUUUUUUUUUUUUUUUUUUUUUUURSOR", cursor);
	const bodyLines = note.body.split("\n");
	bodyLines.splice(cursor.line - 1, 0, ...newLines, "");
	note.body = bodyLines.join("\n");
}


joplin.plugins.register({
	onStart: async function() {
		joplin.commands.register({
			name: 'eauInsertToc',
			label: 'Eau - Insert Table of Contents',
			iconName: 'fas fa-list',
			execute: async () => {
				await insertToc();
			},
		})
	}
});
