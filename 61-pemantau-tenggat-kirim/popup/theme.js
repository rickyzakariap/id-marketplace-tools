(function () {
  'use strict';

  try {
    var savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      savedTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = savedTheme;
  } catch (error) {
    document.documentElement.dataset.theme = 'light';
  }
})();
