# Liu Wanzheng Portfolio

AI product portfolio and interactive lab for Liu Wanzheng.

This is a static website built with plain HTML, CSS, and JavaScript. It can be deployed directly with GitHub Pages from the repository root.

## Local Preview

Run a static server from the repository root:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/`.

## Shared Guestbook

The guestbook uses Supabase as its shared online database.

1. Create a Supabase project.
2. Open the SQL Editor and run `supabase/schema.sql`.
3. Open the project API settings and copy the Project URL and publishable/anon key.
4. Add both values to `config.js`:

```js
window.PORTFOLIO_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_PUBLISHABLE_OR_ANON_KEY",
};
```

The browser key is intentionally public. Never put a `service_role` key in this repository. Row Level Security allows visitors to read visible messages and add new ones, but prevents them from editing or deleting messages.

## GitHub Pages

Recommended settings:

- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`
