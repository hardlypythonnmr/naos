## 0 · Threshold {#top}

# From chat to code

Your AI chat starts almost empty every time. Here is one small step, then seven pieces from 20 October to 17 November.

First piece: Tuesday 20 October, 09:00 New York time (ET), 08:00 in Medellín.

[You came from: {title of the Short}]

## 1 · The question {#the-question}

Why does your chat forget?

Each chat starts almost empty. Where memory is on, a new chat carries a few saved topics from earlier ones. [1]
In a long chat, details can slip. AI models make less use of what sits in the middle of a long text, and some chats drop the oldest part. [4]
A project folder works another way. It keeps your notes and every saved step outside the chat, and a coding agent reads the notes each time it starts. [5]

Our method · Official docs · Study · Sources [1] [2] [3] [4] [5] [7] [8]

You don't have to learn anything. Try one small step.

## 2 · Try it {#try-it}

About two minutes, our estimate. Pick a project you keep in a chat: a trip, a draft, a plan.

1. **Ask for a handover.** Paste the prompt below into that chat.
2. **Read it, and fill the gaps.** Old threads blur, so fix what is missing. [3]
3. **Save it outside the chat.** A phone note, a document you own. Next time, paste it as the first message of a new chat.

When a chat gets long and I care about the project, I ask for a handover.

That's it.

> Before we move this project to a new workspace, write me a handover.
> List the goal of the project, the decisions we made, and the open questions.
> Use short bullet points I can save in a notes file.
> Leave out any passwords, keys or personal data.

[Copy the prompt]

*Watch it: a handover, step by step (about 15 seconds) (folded)*
[Figure: the live piece "A handover, step by step" goes here, inside this fold, after the three steps; visuales/fig/viva.en.html]

*What a handover can look like (folded)*

Goal: plan five days in Cartagena.
Decisions: stay in Getsemaní, go in March.
Open: flights.

Our method · Official docs [3] [11] [12]

If a key was ever in that chat, cancel the old key on the site where you made it, and make a new one. [11] [12] On 16 October 2026 Claude ran this prompt and the other seven once, and we kept the log. Someone new to code has not tried them yet.

*More ways to do this step (folded)* {#on-your-own}

Without paying: this step needs only a chat you already use. No company paid to appear on this page.

On your own, read it out loud; where you stumble, the notes have a gap. With someone, ask if they could carry on from it.

## 3 · The map {#map}

*See the map: from a chat to a project that remembers (folded)*
[Figure: visuales/fig/mapa.en.html goes here, inside this fold. With ?src= the fold stays closed: block 0 already says where you came from, and the node lights up when the map opens.]

Map title: From a chat to a project that remembers

Nodes (2 to 5 words each, by date):
- Tue 20 Oct · All six parts, one video
- Wed 21 Oct · Why the chat forgets
- Fri 23 Oct · What you need
- Sun 25 Oct · The first prompt
- Thu 29 Oct · A memory file
- Sat 7 Nov · Your first real task
- Tue 17 Nov · Guardrails and undo

Alt: Map of this page: seven pieces on one ladder, from the full video on 20 October up to guardrails and undo on 17 November.
What this shows: Each step is one piece, in date order, from a chat that forgets to a project with a home, notes, a safe place to try things and a way back. The piece you came from lights up.
Text version: the list above, and the pieces in section 5.

## 4 · Where this comes from {#where-this-comes-from}

(Folded. Opens on tap.)

Our guides here are the people who write the documentation and the guides for these tools. We start from their pages and cross each claim with others. No company paid to appear on this page, and we get nothing if you sign up. We use Claude to make NAOS.

[Figure: visuales/fig/flujo.en.html goes here, inside the fold]

### The trade

Our guides are the documentation of Claude Code, the Claude Help Center, GitHub Docs, the Git documentation, the Pro Git book and the open AGENTS.md format. They come from inside the trade. [1] [5] [6] [7] [8] [10] Security guidance comes from OWASP, an open community on application security, and from Simon Willison, who writes about AI tools as a practitioner. [12] [13] [14] On what a product does today, the maker's page is the best source there is, and no independent source can say more. So many facts below carry a date. We read them on 16 October 2026, and we read them again the day each piece goes out.

### What the docs say today (16 October 2026)

- **Plans, GitHub and cost.** They are in the card for Friday 23 October, below. [15] [20] [21] [22]
- **Where it runs.** In the desktop app, as a local or a cloud session, and in the browser. On the web the work runs on a virtual machine in the cloud: it clones your repository and sends a branch to GitHub. In a local session it runs on your computer. [16] [17]
- **Asking first.** In manual mode, Claude Code asks before most actions that edit files or run commands. In the terminal and in VS Code, from version 2.1.283, the starting mode is auto, where a classifier (an automatic check) decides in your place. Cloud sessions do not offer manual mode, and their accept-edits mode sends a branch to GitHub without stopping for approval. The desktop docs do not say which mode a new local session starts in. Look at the mode selector, and read the plan before you say yes. [18] [16] [17]
- **Notes files.** Claude reads its notes file, CLAUDE.md, at the start of every session. Anthropic suggests staying under about 200 lines per file, because longer files use more context and reduce adherence. Claude treats the file as "context, not enforced configuration". To block an action whatever Claude decides, use a permission rule or a hook (a small script that runs at set moments). [5] Other tools use a similar file under another name. AGENTS.md is an open format now stewarded by the Agentic AI Foundation, under the Linux Foundation, and Claude Code reads it when there is no CLAUDE.md (version 2.1.277 or later). [5] [6]
- **Saved steps.** A commit saves a snapshot of the project that you can compare with or go back to. [7] A .gitignore file keeps new files out. It does not affect files Git already tracks, so a key that was already saved stays in the history. [10] On this page, "checkpoint" means a commit. Claude Code also has its own checkpoints for quick undo inside a session. They do not track files changed by terminal commands such as deleting, moving or copying, and the docs call them "not a replacement for version control". [19]
- **A key that reached GitHub.** GitHub says the first step is to revoke or rotate it. Commits may still be reachable in other people's copies (forks and clones) and in cached views, and rewriting the history is not enough. [11]
- **Branches.** A branch is a separate space to work in. The main version stays as it was until you decide to join them. [9]

### What the studies say

- **Long text.** In a study published in TACL, language models did best when the relevant information sat at the start or the end of the input, and worse when it sat in the middle. [4] Anthropic's docs call the effect "context rot": the longer the text, the worse the model uses it. [3]
- **Code written with an AI assistant.** In one study of 47 people on five security programming tasks, those with an assistant wrote significantly less secure code and felt more sure it was secure. People who trusted the AI less and reworded their requests made fewer mistakes. The assistant was a 2022 model, so treat it as a reason to look before you say yes. [25]
- **Notes files.** Researchers tested context files on code repositories. The files did not generally improve task success and raised the cost of running the agents by over 20% on average. The agents did follow the instructions, and the files helped with non-standard coding practices. The paper is on its third version, 29 September 2026. [24] They tested programmers' repositories. We found no study of a notes file for someone who comes from a chat.
- **Assistants get facts wrong.** In a study of AI answers about the news, almost half had at least one significant problem: 45% in VRT's count of the European Broadcasting Union study, October 2025. [26] In March 2025 the Tow Center tested eight AI search tools, and more than 60% of their answers on the source of a news passage were wrong. [27] They cover news questions only, and we do not stretch them to prices or software. Asking for the official page and a link, then opening it yourself, is our method.

### Where they disagree

**Notes files.** Anthropic recommends writing them, and also says Claude treats them as "context, not enforced configuration". [5] Gloaguen and colleagues found no general gain in task success and a cost of over 20% on average. [24] They measure different things: programmers' repositories against a personal notes file. So we do not tell you this will help you.

**Memory between chats.** The makers describe it with different names and settings, by chat or by project, and OpenAI's help page did not open for us. We say only that some chats keep notes. [1] [2]

**What a rule can do.** Simon Willison, writing about prompt injection: "we still don't know how to 100% reliably prevent this." His advice is to avoid the combination of private data, untrusted content and a way to send things out. [14] OWASP asks that enforcement sit outside the model and that a person approve high-impact actions. [13]

### Our experiment

- The eight prompts are ours. On 16 October 2026 Claude ran each one once, in English and in Spanish, in new sessions of Claude Code (version 2.1.301, model Claude Sonnet 5.5) on an empty practice project, and we kept the log. Each one did what its card says it asks for. In the first prompt it explained its plan and waited for the OK, in a mode that let it edit without asking. Two things to know: the handover came back longer than asked, with a section of ideas not yet decided, and after writing CLAUDE.md it did not save a checkpoint until a later session. In this run, GitHub was a copy on the same computer, so a real GitHub account, Claude's GitHub app, the desktop app and the browser were not part of it. Someone new to code has not tried the prompts yet.
- The times are our estimates for a person: about two minutes for the handover, about twenty for setup, two to five minutes for the first task, five to fifteen for a small real one. In the run, each of Claude's replies took 7 to 34 seconds, without the time a person needs to read.
- A short notes file may help you pick up where you left off. That is our experiment. The nearest study, on code repositories, does not back it for success or cost.
- Asking the AI to list every file it changed and why, and saying OK only when it is clear, is our method. OWASP asks for human approval before high-impact actions, and the study above is a reason to read before you say yes. [13] [25]

## 5 · The pieces {#pieces}

Times are New York (ET), with Medellín in brackets. The Shorts and Reels are in English.

**Tue 20 Oct · 09:00 ET (08:00) · Medium video · Coming** {#c-2026-10-20-0900-p-medio}
From chat to code
The whole series in one video: why a chat forgets, what you need, and the prompts to paste, step by step. Six parts, each one a Short.
Our method · Official docs [1] [5] [15] · Voice: synthetic

*More on this piece (folded)*

Start with the handover in section 2. Plans, modes and limits change with each version, so we read their pages again on 20 October.

**Wed 21 Oct · 18:00 ET (17:00) · Short and Reel · Coming** {#c-2026-10-21-1800-p-short-reel}
Why the chat forgets
A chat starts almost empty and long threads blur. A project folder keeps what you decided. The prompt asks your chat for a handover.
Our method · Official docs · Study [1] [3] [4] [5] · Voice: synthetic · naos/s/1021p

*More on this piece (folded)*

The prompt is the one in "Try it", above. It asks for a short list: the goal, the decisions, the open questions. Keep it somewhere safe, because the memory file on 29 October uses it.
If a key or a password was ever in that chat, keep it out of the handover and replace the key. [12]

**Fri 23 Oct · 18:00 ET (17:00) · Short and Reel · Coming** {#c-2026-10-23-1800-p-short-reel}
What you need
Three things to start, and two of them cost nothing: an AI plan with a coding agent, a free GitHub account, and one empty private repository.
Our method · Official docs [15] [16] [17] [21] · Voice: synthetic · naos/s/1023p

*More on this piece (folded)*

Our example is Claude Code. It comes with Claude's paid plans, Pro and Max, on the same subscription as the Claude apps, and the limits are shared. It works in a desktop app or in the browser. [15] [16] Setup takes about twenty minutes, once, by our estimate; yours may differ.
A free GitHub account includes unlimited private repositories, with a limited set of features. [21] Make one empty private repository. It is the box your project lives in. Connecting from the browser, a private repository needs Claude's GitHub app. Give the app your practice repository only. You can take that access back in your GitHub settings: suspend the app, uninstall it or de-authorize it. [17] [22]
Agents can use your limits faster than chat. Anthropic's budgeting guide for teams says one debugging session can consume more than a day of chat. [20]
No company paid to appear on this page, and we get nothing if you sign up.
If you are not sure which plan, ask your chat for today's prices from the official pages, then open those pages yourself:

> I want to try an AI coding agent for a small personal project. I have never used a terminal.
> In plain words: what do I need to sign up for, and what does it cost today?
> Use only the official pricing pages, and give me the links.
> Tell me what I should not pay for yet.

[Copy the prompt]

Assistants get facts wrong. In a news study, almost half of the AI answers had a significant problem. [26]
Free route: GitHub Copilot Free includes agent mode in the code editor, with monthly limits of 2,000 completions and an allowance of AI credits. [23] It is an example, and plans change, so read the plan page the day you start.

**Sun 25 Oct · 18:00 ET (17:00) · Short and Reel · Coming** {#c-2026-10-25-1800-p-short-reel}
The first prompt
One prompt that asks the AI to explain its plan and wait for your OK, write a README, add a .gitignore, save a first checkpoint and tell you what it did.
Our method · Official docs [10] [17] [18] [19] · Voice: synthetic · naos/s/1025p

*More on this piece (folded)*

If you can, start in a cloud session: it works on an isolated virtual machine, on the repository you pick, away from the files on your computer. [17] Open Claude Code on your practice repository and paste this:

> I'm new to coding tools. Please set up this project for me.
> 1. Explain your plan in plain words and wait for my OK.
> 2. Write a short README that says what this project is.
> 3. Add a .gitignore that keeps passwords, keys and .env files out.
> 4. Save a first checkpoint (a commit) and send it to GitHub.
> 5. Tell me in one paragraph what you did and what to check.
> Rule: ask before installing, deleting, or touching anything outside this folder.

[Copy the prompt]

It takes two to five minutes, by our estimate. It asks for two new files, README and .gitignore. If something fails, paste the error back and ask what it means.
Some modes ask on every step, others do not, so read the plan first. The "wait for my OK" in the prompt is a request; the mode selector decides. The details are in section 4, under "Asking first". [18]
If you said yes to a step you did not understand, ask: "What did that do, and can it be undone? Show me first, and wait for my OK." The first saved step is what makes undo possible. [19]

**Thu 29 Oct · 18:00 ET (17:00) · Short and Reel · Coming** {#c-2026-10-29-1800-p-short-reel}
A memory file
A short notes file your AI reads at the start of every session. Our experiment: it may help you pick up where you left off.
Our method · Our experiment · Official docs [5] [6] [24] · Voice: synthetic · naos/s/1029p

*More on this piece (folded)*

We have no study showing a notes file helps everyone. The nearest one, on code repositories, found no general gain. [24]
Remember the handover from 21 October? It goes here. Paste this once:

> Create a file called CLAUDE.md for this project, with four sections:
> What this project is (two lines). How we work. Decisions so far. Next time.
> Add the handover from my old chat under Decisions.
> At the end of every session, update it, show me what changed, and save a checkpoint.

[Copy the prompt]

Then start every session with one line:

> Read CLAUDE.md and tell me where we left off.

[Copy the prompt]

Other tools have a similar notes file with a different name. If the file grows past about 200 lines, ask for a cleanup. Short notes work best. [5] [6]
If it does not save a checkpoint after writing the file, ask for one. Old or wrong notes steer every new session, so read the file now and then. If the notes go wrong, ask the AI to restore the previous version. That works when the session ended with a saved step.
Today also: GitHub Universe, in San Francisco, 28 and 29 October, with a free virtual pass. [28]

**Sat 7 Nov · 18:00 ET (18:00) · Short and Reel · Coming** {#c-2026-11-07-1800-p-short-reel}
Your first real task
Pick something small and real. The prompt asks the AI to work on its own branch, list every file it changed and why, and wait for your OK before anything joins the main version.
Our method · Official docs · Study [9] [13] [17] [25] · Voice: synthetic · naos/s/1107p

*More on this piece (folded)*

Swap in your own task:

> Small task: build a one-page weekly checklist I can open in my browser.
> Work on a new branch, not on the main version.
> Keep it small. No new tools without asking.
> When you're done, list every file you changed and why, in plain words.
> Tell me anything you changed that I didn't ask for.
> Wait for my OK before merging into the main version.

[Copy the prompt]

A coding agent plans, writes, runs tests and checks its work, and sometimes fixes its own mistake. It does that best when it has a way to check, such as a test. [17] [20]
A small task takes five to fifteen minutes, by our estimate.
Ask for every file it changed and why, and say OK only when it is clear. OWASP asks for a person to approve high-impact actions before they are taken. [13] In one study, people using an AI assistant wrote less secure code and felt more sure it was fine. Read before you say yes. [25]
If you do not like the result, write: "Show me what this branch changed and wait for my OK. Then throw it away and go back to main."

**Tue 17 Nov · 18:00 ET (18:00) · Short and Reel · Coming** {#c-2026-11-17-1800-p-short-reel}
Guardrails and undo
Five house rules for your AI to paste once, and one sentence that asks it to put the project back where it was at the last saved step.
Our method · Official docs [11] [13] [19] · Voice: synthetic · naos/s/1117p

*More on this piece (folded)*

Paste the house rules once:

> Add these house rules to CLAUDE.md and follow them every session:
> 1. Never ask me to paste passwords or API keys into the chat.
> 2. Never put secrets in files that get saved to GitHub.
> 3. Ask before installing, deleting, or sending anything to GitHub.
> 4. Keep this repository private.
> 5. If you're unsure, stop and ask.

[Copy the prompt]

And when something goes wrong:

> Something went wrong. Put the project back the way it was at the last checkpoint.
> First show me what you will undo, and wait for my OK.
> Then tell me in plain words what you undid.

[Copy the prompt]

The rules follow two ideas from security guidance: give a tool the least access it needs, and ask a person to approve high-impact actions. That match is our reading. [13]
The AI reads the rules as requests and may not follow them every time. A permission rule or a hook is what blocks an action for certain. [5]
The undo works when there was a saved step before the bad one, so practice it before you need it. Claude Code's own rewind does not track files changed by terminal commands. [19]
Undo cannot fix a key that already reached GitHub or a chat. Cancel the old key on the site where you made it, make a new one, then clean the files. [11]
This week also: Microsoft Ignite, in San Francisco, 17 to 20 November. [29]

## 6 · Tell someone {#tell-someone}

Tell someone what your chat forgot, then send them this page.

[Send this]

The line to carry: Talk in the chat. Keep what you decided somewhere else.

## 7 · One more thing {#one-more-thing}

Next: {next piece, day and ET time}. Default: Tue 20 Oct, 09:00 ET (08:00 in Medellín) · From chat to code

A step away from the screen, at the table: Phones in the bread basket

## 8 · Sources {#sources}

Each source with what it holds. For the trade, the maker's pages come first, then the cross-checks, and we say which speak from inside. Read on 16 October 2026. Archive copies, where we have one, follow "Archive".

### The trade

[1] Anthropic. Claude Help Center: Use Claude's chat search and memory to build on previous context. Official, from inside. Holds that memory is on by default on Free, Pro and Max and that each project has its own. https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context · Archive https://web.archive.org/web/20261015201716/https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context

[2] Willison, S. (21 May 2025). I really don't like ChatGPT's new memory dossier. Practitioner. Holds the description of ChatGPT's memory as a dossier on past conversations. https://simonwillison.net/2025/May/21/chatgpt-new-memory/ · Archive https://web.archive.org/web/20261016023134/https://simonwillison.net/2025/May/21/chatgpt-new-memory/ · OpenAI Help Center, Memory FAQ: it did not open for us, https://help.openai.com/en/articles/8590148-memory-faq

[3] Anthropic. Context windows. Official. Holds the name "context rot" and the note that some chats drop the oldest part of a long conversation. https://platform.claude.com/docs/en/build-with-claude/context-windows · Archive https://web.archive.org/web/20261016023115/https://platform.claude.com/docs/en/build-with-claude/context-windows

[4] Liu and others (2024). Lost in the Middle: How Language Models Use Long Contexts. Transactions of the Association for Computational Linguistics. Study, strong for what it measured: models did best with relevant information at the start or the end. https://doi.org/10.1162/tacl_a_00638

[5] Anthropic. Claude Code docs: How Claude remembers your project. Official, from inside. Holds the fresh start of each session, CLAUDE.md, the 200-line suggestion and "context, not enforced configuration". https://code.claude.com/docs/en/memory · Archive https://web.archive.org/web/20261016022453/https://code.claude.com/docs/en/memory

[6] AGENTS.md. An open format for guiding coding agents, stewarded by the Agentic AI Foundation under the Linux Foundation. The tools it lists are self-declared. https://agents.md/

[7] Chacon, S. and Straub, B. Pro Git (Spanish edition). Fundamentos de Git: Guardando cambios en el Repositorio. Book, from inside. Holds that each commit saves a snapshot you can compare with or go back to. https://git-scm.com/book/es/v2/Fundamentos-de-Git-Guardando-cambios-en-el-Repositorio

[8] GitHub Docs. About repositories. Official. Holds that a repository stores your code, your files and each file's revision history, and who can see a private one. https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories

[9] Chacon, S. and Straub, B. Pro Git: Branches in a Nutshell. Book, from inside. https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell · Archive https://web.archive.org/web/20261016023214/https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell · GitHub Docs, Branches (section "About branches"), official; holds that branches let you work or experiment in a contained area: https://docs.github.com/en/pull-requests/reference/branches · Archive https://web.archive.org/web/20261016023256/https://docs.github.com/en/pull-requests/reference/branches

[10] Git documentation: gitignore. Official, from inside. Holds that files already tracked are not affected. https://git-scm.com/docs/gitignore · Archive https://web.archive.org/web/20261016022520/https://git-scm.com/docs/gitignore · GitHub Docs, Ignoring files: https://docs.github.com/en/get-started/git-basics/ignoring-files

[11] GitHub Docs. Removing sensitive data from a repository. Official. Holds "revoke and/or rotate" as a first step and that commits may remain reachable elsewhere. https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

### Security guidance

[12] OWASP GenAI Security Project. LLM02:2025 Sensitive Information Disclosure. Community guidance. It asks for care in what you enter and counts credentials among sensitive data. The wording "passwords in a chat" is ours. https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/

[13] OWASP GenAI Security Project. LLM06:2025 Excessive Agency. Community guidance. Holds least privilege, enforcement outside the model, and human approval of high-impact actions. https://genai.owasp.org/llmrisk/llm062025-excessive-agency/

[14] Willison, S. (16 June 2025). The lethal trifecta for AI agents: private data, untrusted content, and external communication. Practitioner. About prompt injection; it does not speak of notes files. https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ · Archive https://web.archive.org/web/20261016023142/https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/

### Plans, cloud and permissions

[15] Anthropic. Claude Help Center: Use Claude Code with your Pro or Max plan. Official. Holds the shared limits. https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan · Archive https://web.archive.org/web/20261015162959/https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan

[16] Anthropic. Claude Code docs: Desktop application. Official. Holds local and cloud sessions in the desktop app. https://code.claude.com/docs/en/desktop · Archive https://web.archive.org/web/20261016023043/https://code.claude.com/docs/en/desktop

[17] Anthropic. Claude Code docs: Get started with Claude Code in the cloud. Official. Holds the GitHub requirement, the virtual machine and the pushed branch. https://code.claude.com/docs/en/web-quickstart · Archive https://web.archive.org/web/20261016023055/https://code.claude.com/docs/en/web-quickstart

[18] Anthropic. Claude Code docs: Choose a permission mode. Official, dated to version 2.1.283. https://code.claude.com/docs/en/permission-modes · Archive https://web.archive.org/web/20261016023036/https://code.claude.com/docs/en/permission-modes

[19] Anthropic. Claude Code docs: Checkpointing. Official. Holds that checkpoints do not track files changed by terminal commands. https://code.claude.com/docs/en/checkpointing · Archive https://web.archive.org/web/20261016023055/https://code.claude.com/docs/en/checkpointing

[20] Anthropic. Claude Code docs: Manage costs effectively. Official; its budgeting section is written for teams. https://code.claude.com/docs/en/costs · Archive https://web.archive.org/web/20261016023056/https://code.claude.com/docs/en/costs

[21] GitHub Docs. GitHub's plans. Official. Holds unlimited private repositories on the free plan, with a limited feature set. https://docs.github.com/en/get-started/learning-about-github/githubs-plans · GitHub pricing: https://github.com/pricing

[22] GitHub Docs. Reviewing and modifying installed GitHub Apps. Official. Holds repository access, suspend, uninstall and de-authorize. https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps

[23] GitHub Docs. Plans for GitHub Copilot. Official. Holds agent mode and monthly limits on the free plan. https://docs.github.com/en/copilot/get-started/plans

### Studies and counts

[24] Gloaguen and others (2026). Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents? arXiv 2602.11988, version 3, 29 September 2026. Preprint, CC BY 4.0. Code repositories only. https://arxiv.org/abs/2602.11988 · Archive https://web.archive.org/web/20261001113623/https://arxiv.org/abs/2602.11988

[25] Perry, Srivastava, Kumar and Boneh (2023). Do Users Write More Insecure Code with AI Assistants? ACM Conference on Computer and Communications Security. Study, moderate: 47 people, one 2022 assistant. https://doi.org/10.1145/3576915.3623157

[26] European Broadcasting Union and BBC (21 October 2025). News Integrity in AI Assistants. Official report page; it says "almost half". https://www.ebu.ch/research/open/report/news-integrity-in-ai-assistants · VRT, for the EBU (22 October 2025), press release by a member of the Union; the 45% comes from here: https://communication.vrt.be/largest-study-of-its-kind-shows-ai-assistants-misrepresent-news-content-45-of-the-time-regardless-of-language-or-territory

[27] Tow Center for Digital Journalism, Columbia (6 March 2025). AI Search Has a Citation Problem. Columbia Journalism Review. University center, not peer reviewed. https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php

### Dates of events

[28] GitHub Blog (4 June 2026). GitHub Universe is back: All together now, in the agentic era. Official. https://github.blog/news-insights/company-news/github-universe-is-back-all-together-now-in-the-agentic-era/ · GitHub Universe: https://githubuniverse.com/

[29] Moscone Center. Microsoft Ignite 2026. Venue listing, 17 to 20 November 2026. https://www.moscone.com/events/microsoft-ignite-2026 · Archive https://web.archive.org/web/20261016083853/https://www.moscone.com/events/microsoft-ignite-2026 · Kurt Shintaku's blog (27 June 2026): https://kurtsh.com/2026/06/27/event-microsoft-ignite-2026-san-francisco-ca-november-17-20-2026-registration-is-now-open/ · UC Today, Microsoft Ignite 2026 Returns to San Francisco, But Not Everyone's Thrilled: https://uctoday.com/microsoft-ignite-2026-returns-to-san-francisco-but-not-everyones-thrilled · Archive https://web.archive.org/web/20261016023554/https://uctoday.com/microsoft-ignite-2026-returns-to-san-francisco-but-not-everyones-thrilled

### Help lines

[30] Colombia: Ministry of Health, line 106, free, confidential, 24/7: https://minsalud.gov.co/salud/publica/salud-mental/Paginas/linea-106.aspx · Colombia, 123 in immediate danger: Find A Helpline, Colombia helplines and hotlines (its emergency button dials 123): https://findahelpline.com/countries/co · US: 988 Lifeline: https://988lifeline.org/get-help/ · Anywhere else: https://findahelpline.com

### How we checked this page

On 16 October 2026 we opened the sources we could and checked each paper for retractions (none). The same day Claude ran the eight prompts once in each language, and we kept the log. Where a page would not open, we say so below and read the claim through a second source. Where a number rests on one source, the page says so. Most product facts rest on the maker's own pages, so they carry a date.

### What we could not confirm

- How the eight prompts go for someone new to code. Claude ran them once, from the command line, with a copy of GitHub on the same computer; nobody has run them yet in the desktop app, in the browser or with a real GitHub account.
- The times: about two minutes for the handover, twenty for setup, two to five for the first task, five to fifteen for a small one. They are our estimates, and we have not timed a person.
- OpenAI's memory help page did not open for us (error 403). We describe ChatGPT's memory only through a practitioner's account.
- Which mode a new local session starts in on the desktop app. The docs do not say.
- The permission modes and the notes-file rules are tied to Claude Code versions 2.1.283 and 2.1.277. They change, and we read them again on 20 October.
- Plans and free limits change. We did not read the exact monthly credit allowance of the free Copilot plan.
- Microsoft's own Ignite page showed no dates when we read it. The dates come from the venue listing and a blog.
- Whether a notes file helps someone who is not a programmer. We found no study, and no independent practitioner source either.

If we told something wrong, tell us. Corrections welcome.

What we made with these tools, and what each step left behind: Built here

## Footer (fixed, same place on every page)

If this is weighing on you, talk to someone now. Colombia: 106, national mental health line, 24/7, or 123 in immediate danger. US: 988. Anywhere else: findahelpline.com. [30]

Closer to yourself.

Eat well, sleep well, get moving, have a relationship with the divine, and build community.

The voices in NAOS pieces are synthetic. Cella's replies to comments are written with AI; a person reads the hard ones. Times are New York (ET) and Medellín.
