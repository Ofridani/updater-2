import { customElement } from 'solid-element';

customElement('updater-alert-banner', { title: 'Alert', message: '' }, (props) => {
  return (
    <section role="status" aria-live="polite">
      <strong>{props.title}</strong>
      <p>{props.message}</p>
    </section>
  );
});
