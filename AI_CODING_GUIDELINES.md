
# AI Coding Guidelines for the current project

This document provides guidelines for the AI assistant (Firebase Studio App Prototyper) when making code changes to the project.

## I. General Coding Style & Best Practices

1.  **Clarity & Readability:** Prioritize clear, concise, and readable code.
2.  **Consistency:** Maintain consistency with the existing codebase's style and patterns.
3.  **Next.js & React Best Practices:**
    *   Prefer Functional Components and Hooks.
    *   Utilize Server Components where appropriate for performance.
    *   Follow Next.js App Router conventions.
    *   Ensure components are well-structured and reusable.
4.  **TypeScript:**
    *   Use TypeScript effectively for type safety.
    *   Use `import type` for type-only imports.
5.  **Tailwind CSS & ShadCN UI:**
    *   Utilize Tailwind CSS for styling.
    *   Leverage ShadCN UI components whenever suitable, maintaining their intended structure and styling.
    *   Adhere to the project's theme defined in `src/app/globals.css` for colors.
6.  **Firebase Firestore:**
    *   Follow Firestore best practices for data modeling (considering denormalization where appropriate for read performance).
    *   Use batched writes or transactions for atomic operations.
    *   Implement proper error handling for database operations.
7.  **Genkit (AI Features):**
    *   Follow the specific Genkit v1.x API guidance provided in the main prompt.
    *   Define clear input/output schemas for flows using Zod.
    *   Use Handlebars for templating within prompts, avoiding complex logic.
    *   Utilize Genkit tools for function calling when the LLM needs to decide to fetch external data or perform actions.
8.  **Error Handling:** Implement robust error handling for API calls, database operations, and user inputs.
9.  **Comments:** Add comments only when necessary to explain complex logic or non-obvious decisions. Avoid over-commenting. Code should be as self-documenting as possible.
10. **No Unused Code/Imports:** Ensure no unused variables, functions, or imports are left in the code.
11. **Conciseness in Explanations:** When explaining changes, be clear and concise.

## II. Applying Code Changes (XML Format) - CRITICAL REMINDER

When making changes to the app code, you **MUST** use the following XML-based structure. This XML structure provides a clear, machine-readable plan for file modifications that will be automatically applied. You generate the plan; you do not execute the changes.

**DO NOT respond with "(Omitted from agent history: ...)" when code changes are requested.** You must actually generate the XML with the file changes.

```xml
<changes>
  <description>[Provide a concise summary of the overall changes being made, e.g., "Implemented user profile editing functionality"]</description>
  <change>
    <file>[Provide the ABSOLUTE, FULL path to the file being modified, e.g., /src/app/profile/edit/page.tsx]</file>
    <content><![CDATA[Provide the ENTIRE, FINAL, intended content of the file here.
    Do NOT provide diffs or partial snippets.
    Ensure all code is properly escaped within the CDATA section if necessary (though CDATA handles most special characters like <, >, &).
    ]]></content> 
  </change> 
</changes>
```

If the content itself contains ']]>', it must be broken up (e.g., ']' + ']' + '>').
The content must be the complete file content from the first line to the last.

Example:

If you are asked to change a single line in src/app/example.tsx from const a = 1; to const a = 2; and the file is 10 lines long, the <content> block must contain all 10 lines of src/app/example.tsx with that one line changed.

Adherence to this XML format is crucial for the changes to be applied correctly. 