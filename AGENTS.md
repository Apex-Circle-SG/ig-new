# User preferences

Keep replies very short. Lead with the result or current blocker; put detailed evidence in linked reports. Give longer explanations only when explicitly requested.

# Organizing supplied content

When the user supplies knowledge, examine its contents and choose the most useful site layout, categories, cross-links, and reader flow. Organize each item by its meaning and destination rather than copying source document titles or forcing mixed material into one topic. Place knowledge, tools, and other content in their appropriate sections and connect related items. Preserve the source and identify missing or uncertain material rather than inventing it.

Choose each page’s format to make its content clear and engaging, including infographic-style layouts where useful. Include advertising on pages while preserving consent and privacy safeguards.

## Content classification and reader experience

Before adding or publishing content, read and understand it, identify its subject and reader intent, and decide where it belongs. Classify each item into an appropriate category, folder, and section; create a category when existing ones do not fit. Move or split material into the right places when a supplied destination is unsuitable. Connect related material and preserve important meaning and source traceability. Never bulk-publish unexamined material or use source filenames, import IDs, or labels such as `AI-1520` as reader-facing titles.

Curate the library as a reader-friendly knowledge hub, not an information dump. Write meaningful titles, introductions, and summaries, organize long material into clear sections, and remove redundant clutter without discarding important content. Use infographic-style summaries, diagrams, comparisons, or steps when they clarify the subject, while retaining accessible, readable detail.

Visuals must be relevant to their content and consistent with the website's established theme, colors, and typography. Do not paste oversized or mismatched source images into pages. Resize and optimize images for their displayed use, and use lightweight vectors or diagrams when appropriate. Check category navigation, readability, and visual presentation on mobile and desktop.

## Digital hygiene

Keep the codebase clean during implementation: refactor meaningful duplication, delete unused code and obsolete generated files, and keep credentials and temporary artifacts out of Git. Preserve source traceability, user changes, active services and data. Use the mounted /mnt/sdb volume for suitable extra storage after checking capacity. Push only when the user explicitly requests it.

## Engineering standards

Apply the installed Matt Pocock and Ponytail skills when relevant to implementation and refactoring. Use Graphify for code relationship queries and refresh its bounded architecture graph after structural changes. Prefer readable code, small useful interfaces, existing patterns and dependencies, and verification of changed behavior. Do not treat fewer lines or archived content as substitutes for completing the requested work.

## Sitemap maintenance

Maintain a complete combined sitemap and human-readable content index. Whenever published content or tools are added, moved, combined or removed, update their sitemap discovery and canonical links in the same change. Library articles are discovered from the published catalogue automatically; register new static tool routes and verify their category and related links.
