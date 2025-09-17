  function savePreferences(event) {
      event?.preventDefault();

      const form = document.querySelector('#questionnaireForm');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      localStorage.setItem('participantData', JSON.stringify(data));

      const modal = new bootstrap.Modal(document.getElementById('savedModal'));
      modal.show();
    }

    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', () => {
          card.querySelector("input").checked = true;
          document.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
        });
      });

      document.getElementById('saveBtn').addEventListener('click', savePreferences);
    });