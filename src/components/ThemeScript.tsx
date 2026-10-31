const script = `
(function () {
  try {
    var stored = localStorage.getItem('sa-theme');
    var choice = stored === 'dark' || stored === 'light' || stored === 'auto' ? stored : 'auto';
    var dark = choice === 'auto'
      ? !window.matchMedia('(prefers-color-scheme: light)').matches
      : choice === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme-choice', choice);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-theme-choice', 'auto');
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
