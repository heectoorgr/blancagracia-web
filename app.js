
let siteContent = {};
try {
  const contentResponse = await fetch('content.json', { cache: 'no-store' });
  if (contentResponse.ok) siteContent = await contentResponse.json();
} catch (error) {
  console.warn('No se pudo cargar content.json, se usará el contenido por defecto.', error);
}

const toImageUrl = (path) => path.split('/').map(encodeURIComponent).join('/');
const getYouTubeId = (url) => {
  const match = (url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
};

const homePanel = document.createElement('section');
homePanel.className = 'content-panel home-panel';
homePanel.dataset.content = 'inicio';
homePanel.setAttribute('role', 'tabpanel');
homePanel.innerHTML = '';
document.querySelector('.site-shell').insertBefore(homePanel, document.querySelector('[data-content="sobre-mi"]'));
const aboutPanel = document.querySelector('[data-content="sobre-mi"]');
const homeAboutArrow = document.querySelector('.home-about-arrow');
homeAboutArrow?.addEventListener('click', () => {
  const isInAbout = homeAboutArrow.classList.contains('is-about');
  if (isInAbout) {
    homeAboutArrow.classList.remove('is-about');
    homeAboutArrow.textContent = '↓';
    homeAboutArrow.setAttribute('aria-label', 'Ir a Biografía');
    document.querySelector('.site-header')?.append(homeAboutArrow);
    showPanel('inicio', 'back');
    window.history.replaceState(null, '', '#inicio');
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    return;
  }
  homeAboutArrow.classList.add('is-about');
  homeAboutArrow.textContent = '↑';
  homeAboutArrow.setAttribute('aria-label', 'Volver a Inicio');
  showPanel('sobre-mi', 'forward');
  window.history.replaceState(null, '', '#sobre-mi');
  aboutPanel?.append(homeAboutArrow);
  aboutPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
const aboutPhotos = document.createElement('div');
aboutPhotos.className = 'about-photos';
aboutPhotos.setAttribute('aria-label', 'Fotografías de Blanca');
const defaultBioPhotos = ['images/collage /WhatsApp Image 2022-10-02 at 23.08.51 (1).jpeg', 'images/collage /WhatsApp Image 2022-10-02 at 23.08.49.jpeg', 'images/collage /Blanca_Color-11.jpg'];
const bioPhotos = (siteContent.bio?.photos?.length ? siteContent.bio.photos : defaultBioPhotos).map(toImageUrl);
const aboutPhotoSources = window.matchMedia('(min-width: 701px)').matches ? bioPhotos : bioPhotos.slice(0, 2);
aboutPhotoSources.forEach((imageSource) => {
  const figure = document.createElement('figure');
  const image = document.createElement('img');
  image.src = imageSource;
  image.alt = 'Blanca Graciá Rodríguez';
  figure.append(image);
  aboutPhotos.append(figure);
});
aboutPanel.querySelector('.about-intro')?.append(aboutPhotos);
const collageImages = {
  horizontal: ['4W7A2473.jpg', '4W7A2476.jpg', 'NOS C.jpg', 'WhatsApp Image 2022-10-02 at 23.08.49.jpeg', 'WhatsApp Image 2022-10-02 at 23.08.51 (1).jpeg']
};
const verticalImages = ['Blanca_BnW-1.jpg', 'Blanca_BnW-2.jpg', 'Blanca_BnW-3.jpg', 'Blanca_BnW-4.jpg', 'Blanca_BnW-5.jpg', 'Blanca_BnW-6.jpg', 'Blanca_BnW-7.jpg', 'Blanca_BnW-8.jpg', 'Blanca_Color-1.jpg', 'Blanca_Color-11.jpg', 'Blanca_Color-12.jpg', 'Blanca_Color-2.jpg', 'Blanca_Color-3.jpg', 'Blanca_Color-4.jpg', 'Blanca_Color-5.jpg', 'Blanca_Color-6.jpg', 'Blanca_Color-7.jpg', 'Blanca_Color-8.jpg', 'IMG_1471.PNG', 'IMG_1472.PNG', 'Example01.jpg'];
const collageUrl = (fileName) => fileName === 'NOS C.jpg' ? 'images/NOS%20C.jpg' : `images/collage%20/${encodeURIComponent(fileName)}`;
const homeCollages = document.createElement('div');
homeCollages.className = 'home-collages';
homeCollages.hidden = true;
homeCollages.innerHTML = Object.entries(collageImages).map(([orientation, files]) => `<section class="home-collage"><h3>${orientation === 'horizontal' ? 'Pianista, Repetidora y Coach Vocal' : ''}</h3><div class="collage-grid collage-grid-${orientation}">${files.map((fileName) => `<figure><img src="${collageUrl(fileName)}" alt="" loading="lazy"></figure>`).join('')}</div></section>`).join('');
const horizontalGrid = homeCollages.querySelector('.collage-grid-horizontal');
const horizontalHeading = homeCollages.querySelector('.home-collage h3');
const toggleHorizontalPhotos = () => {
  const isVisible = !horizontalGrid.classList.contains('photos-hidden');
  horizontalGrid.classList.toggle('photos-hidden', isVisible);
};
horizontalHeading.setAttribute('role', 'button');
horizontalHeading.setAttribute('tabindex', '0');
horizontalHeading.setAttribute('aria-expanded', 'true');
horizontalHeading.addEventListener('click', toggleHorizontalPhotos);
horizontalHeading.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleHorizontalPhotos(); } });
const collageTrigger = document.createElement('button');
collageTrigger.className = 'home-collage-trigger';
collageTrigger.type = 'button';
collageTrigger.textContent = '↓';
collageTrigger.setAttribute('aria-label', 'Mostrar collages');
homePanel.append(collageTrigger, homeCollages);
collageTrigger.remove();
const verticalCollages = document.createElement('div');
verticalCollages.className = 'home-collages vertical-collages';
verticalCollages.hidden = true;
verticalCollages.innerHTML = `<section class="home-collage"><h3>Verticales</h3><div class="collage-grid collage-grid-vertical">${verticalImages.map((fileName) => `<figure><img src="${collageUrl(fileName)}" alt="" loading="lazy"></figure>`).join('')}</div></section>`;
const verticalTrigger = document.createElement('button');
verticalTrigger.className = 'home-collage-trigger vertical-trigger';
verticalTrigger.type = 'button';
verticalTrigger.textContent = '↓';
verticalTrigger.setAttribute('aria-label', 'Mostrar collage vertical');
homePanel.insertBefore(verticalTrigger, homeCollages);
homePanel.insertBefore(verticalCollages, homeCollages);
const collageControls = document.createElement('div');
collageControls.className = 'collage-controls';
collageControls.append(collageTrigger, verticalTrigger);
homePanel.insertBefore(collageControls, verticalCollages);
const collageClose = document.createElement('button');
collageClose.className = 'collage-close';
collageClose.type = 'button';
collageClose.textContent = '→';
collageClose.setAttribute('aria-label', 'Ir a Sobre mí');
homeCollages.append(collageClose);
collageTrigger.addEventListener('click', () => {
  const isOpen = !homeCollages.hidden;
  if (isOpen) {
    homeCollages.classList.remove('collages-visible');
    homeCollages.classList.add('collages-hiding');
    window.setTimeout(() => {
      homeCollages.hidden = true;
      homeCollages.classList.remove('collages-hiding');
    }, 1000);
  } else {
    homeCollages.hidden = false;
    homeCollages.classList.remove('collages-hiding');
    void homeCollages.offsetWidth;
    homeCollages.classList.add('collages-visible');
  }
  collageTrigger.textContent = isOpen ? '↓' : '↑';
  collageTrigger.setAttribute('aria-label', isOpen ? 'Mostrar collages' : 'Ocultar collages');
  if (!isOpen) homeCollages.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

verticalTrigger.addEventListener('click', () => {
  const isOpen = !verticalCollages.hidden;
  verticalCollages.hidden = isOpen;
  verticalTrigger.textContent = isOpen ? '↓' : '↑';
  verticalTrigger.setAttribute('aria-label', isOpen ? 'Mostrar collage vertical' : 'Ocultar collage vertical');
  if (!isOpen) verticalCollages.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

collageClose.addEventListener('click', () => {
  homeCollages.classList.remove('collages-visible');
  homeCollages.classList.add('collages-hiding');
  collageTrigger.textContent = '↓';
  collageTrigger.setAttribute('aria-label', 'Mostrar collages');
  window.setTimeout(() => {
    homeCollages.hidden = true;
    homeCollages.classList.remove('collages-hiding');
    collageTrigger.hidden = false;
    collageTrigger.textContent = '↓';
    collageTrigger.setAttribute('aria-label', 'Mostrar collages');
    aboutPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 1000);
});
homePanel.querySelector('h2')?.remove();
const homeRole = homePanel.querySelector('.home-role');
const homeJump = document.createElement('button');
homeJump.className = 'home-jump';
homeJump.type = 'button';
homeJump.textContent = 'Ver perfil ↓';
homeJump.setAttribute('aria-label', 'Bajar al texto del perfil');
homeRole?.before(homeJump);
const goToHomePhoto = () => homePhoto?.scrollIntoView({ behavior: 'smooth', block: 'center' });
homeJump.addEventListener('click', goToHomePhoto);
homeRole?.setAttribute('role', 'button');
homeRole?.setAttribute('tabindex', '0');
homeRole?.setAttribute('aria-label', 'Ir a la imagen Blanca Color 6');
homeRole?.addEventListener('click', goToHomePhoto);
homeRole?.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); goToHomePhoto(); } });
const homeButton = document.createElement('button');
homeButton.type = 'button';
homeButton.dataset.panel = 'inicio';
homeButton.setAttribute('role', 'tab');
homeButton.textContent = 'Inicio';
document.querySelector('.section-nav').prepend(homeButton);
document.querySelector('.header-role')?.remove();
let buttons = document.querySelectorAll('[data-panel]');
let panels = document.querySelectorAll('[data-content]');
const languageButtons = document.querySelectorAll('[data-language]');
let profileOverlayHideTimer;
document.querySelector('.header-role')?.remove();
const aboutDownButton = document.querySelector('.about-down-button');
const aboutPhoto = document.querySelector('#about-photo-reveal');
aboutPhoto?.removeAttribute('hidden');
aboutPhoto?.remove();
aboutDownButton?.remove();
const auditionsDot = document.querySelector('.auditions-dot');
const auditionsSection = document.querySelector('#auditions-section');
const socialPanel = document.querySelector('[data-content="redes"]');

const notionScheduleUrl = 'https://dashing-need-0dc.notion.site/3c6d882b0e3180908109d07874becee0?v=3c6d882b0e3180d0b71d000c403836c0&pvs=141';

function showExitNotice(link) {
  if (localStorage.getItem('skipExitNotice') === 'true') {
    window.open(link.href, '_blank', 'noopener,noreferrer');
    return;
  }

  const notice = document.createElement('div');
  notice.className = 'exit-notice';
  notice.innerHTML = '<div class="exit-notice-box" role="dialog" aria-modal="true" aria-labelledby="exit-notice-title"><h2 id="exit-notice-title">Vas a abandonar esta página</h2><p>Vas a abrir un enlace externo. ¿Quieres continuar?</p><label><input type="checkbox" class="exit-notice-checkbox"> No volver a recordármelo</label><div class="exit-notice-actions"><button type="button" class="exit-notice-cancel">Cancelar</button><button type="button" class="exit-notice-continue">Continuar</button></div></div>';
  document.body.append(notice);
  notice.querySelector('.exit-notice-checkbox').focus();

  const closeNotice = (continueNavigation) => {
    if (continueNavigation && notice.querySelector('.exit-notice-checkbox').checked) localStorage.setItem('skipExitNotice', 'true');
    notice.remove();
    if (continueNavigation) window.open(link.href, '_blank', 'noopener,noreferrer');
  };

  notice.querySelector('.exit-notice-cancel').addEventListener('click', () => closeNotice(false));
  notice.querySelector('.exit-notice-continue').addEventListener('click', () => closeNotice(true));
}

const translations = {
  en: {
    nav: ['Home', 'About', 'Schedule', 'Media', 'Contact'],
    panelKickers: ['', '01 · Introduction', '02 · Coming up', '03 · Connect', '04 · Let’s talk', '05 · Photos'],
    headings: ['Home', 'About', 'Schedule', 'Social Media', 'Contact'],
    about: ['Hi, I’m Blanca. This is my personal space: a place to share who I am, the projects I’m working on and the things that inspire me.', 'You can replace this text with your introduction, your journey and whatever you would like people to know about you.', 'Right now', 'Available for new opportunities, collaborations and interesting conversations.'],
    agendaIntro: 'Check my upcoming events, meetings and available time slots.',
    socialIntro: 'Find me in these spaces too.',
    opinionsIntro: 'Recommendations and words from people I have shared projects with.',
    contactIntro: 'Do you have an idea, a proposal or simply want to say hello? Write to me using this form.',
    labels: ['Name', 'Email', 'Message'],
    placeholders: ['Your name', 'you@email.com', 'Write your message'],
    send: 'Send message',
    pastEventsTitle: '02. Past events',
    auditionsTitle: 'Recordings',
    agendaCards: ['[DAY · DATE]', '[Event or meeting]', '[Time and place]'],
    pastCards: ['[DATE]', '[Past event]', '[Place or description]'],
    role: 'Pianist, Répétiteur, Vocal Coach',
    galleryTitle: 'Gallery',
    scheduleHint: 'Take a look at my schedule',
    previousEventsTitle: 'Previous events',
    upcomingTitle: 'Upcoming',
    scheduleTitle: 'Schedule',
    previousEventDate: '[DATE]',
    previousEventName: '[Event name]',
    previousEventPlace: '[Venue]',
    previousEventDescription: '[Brief event description]',
    aboutBio: ['Trained at the Professional Conservatory of Elda “Ana María Sánchez”, she continued her higher studies at the “Joaquín Rodrigo” Higher Conservatory of Music in Valencia, where she graduated with honours in Piano. Her artistic curiosity led her to continue her training in Germany and later at the Royal Conservatoire of Antwerp, where she obtained a Master’s degree in Vocal Accompaniment and Lied with highest honours under the direction of Jeanne-Minette Cilliers.', 'Her professional career has grown significantly in recent years. She was part of the 2023–2024 Young Artists Programme at London’s National Opera Studio and has recently worked as a répétiteur at English National Opera during the 2025–2026 season. In this context, she has participated in opera productions under renowned conductors including Julia Jones, Marie Jacquot, Clelia Cafiero, Yi-Chen Li, Matthew Kofi Waldren and Kerem Hasan, among others.', 'As a Lied specialist, Blanca Graciá Rodríguez has performed at leading international festivals such as Oxford Lieder Festival, SongEasel and the Hidalgo Festival in Munich. She has also received recognition in several competitions, becoming a finalist in the II International Lied and Song Competition (Spain, 2018), the Galantes Talanti Competition (Latvia, 2022) and the Ashburnham English Song Awards (2025), as well as winning third prize at the International Music Competition France in 2022.', 'With this appointment, Elda recognises the talent, international profile and artistic excellence of a local musician who will bring her experience and sensitivity to the pasodoble Idella, adding a new dimension to this much-anticipated and beloved event.']
  },
  es: {
    nav: ['Inicio', 'Biografía', 'Agenda', 'Media', 'Contacto'],
    panelKickers: ['', '01 · Presentación', '02 · Próximamente', '03 · Conecta', '04 · Hablemos', '05 · Fotos'],
    headings: ['Inicio', 'Biografía', 'Agenda', 'Redes Sociales', 'Contacto'],
    about: ['Hola, soy Blanca. Este es mi espacio personal: un lugar para compartir quién soy, en qué proyectos estoy trabajando y las cosas que me inspiran.', 'Puedes sustituir este texto por tu presentación, tu trayectoria y aquello que quieras que las personas conozcan de ti.', 'Ahora mismo', 'Disponible para nuevas oportunidades, colaboraciones y conversaciones interesantes.'],
    agendaIntro: 'Consulta mis próximos eventos, reuniones y espacios disponibles.',
    socialIntro: 'Encuéntrame también en estos espacios.',
    opinionsIntro: 'Recomendaciones y palabras de personas con las que he compartido proyectos.',
    contactIntro: '¿Tienes una idea, una propuesta o simplemente quieres saludar? Puedes escribirme mediante este formulario.',
    labels: ['Nombre', 'Email', 'Mensaje'],
    placeholders: ['Tu nombre', 'tu@email.com', 'Escribe tu mensaje'],
    send: 'Enviar mensaje',
    pastEventsTitle: '02. Eventos pasados',
    auditionsTitle: 'Audiciones',
    agendaCards: ['[DÍA · FECHA]', '[Evento o reunión]', '[Hora y lugar]'],
    pastCards: ['[FECHA]', '[Evento pasado]', '[Lugar o descripción]'],
    role: 'Pianista, Repetidora y Coach Vocal',
    galleryTitle: 'Galería',
    scheduleHint: 'Mira mi agenda',
    previousEventsTitle: 'Eventos anteriores',
    upcomingTitle: 'Próximamente',
    scheduleTitle: 'Agenda',
    previousEventDate: '[FECHA]',
    previousEventName: '[Nombre del evento]',
    previousEventPlace: '[Lugar]',
    previousEventDescription: '[Descripción breve del evento]',
    aboutBio: ['Formada en el Conservatorio Profesional de Elda “Ana María Sánchez”, continuó sus estudios superiores en el Conservatorio Superior de Música “Joaquín Rodrigo” de Valencia, donde se graduó en la especialidad de Piano con honores. Su inquietud artística la llevó a ampliar su formación en Alemania y posteriormente en el Conservatorio Real de Amberes, donde obtuvo el Máster en Acompañamiento Vocal y Lied con matrícula de honor bajo la dirección de Jeanne-Minette Cilliers.', 'Su trayectoria profesional ha experimentado un notable crecimiento en los últimos años. Ha formado parte del Programa para Jóvenes Artistas 2023–2024 del National Opera Studio de Londres y, recientemente, ha desarrollado su labor como pianista repetidora en la English National Opera durante la temporada 2025–2026. En este contexto, ha participado en diversas producciones operísticas bajo la dirección de reconocidos maestros como Julia Jones, Marie Jacquot, Clelia Cafiero, Yi-Chen Li, Matthew Kofi Waldren y Kerem Hasan, entre otros.', 'Como intérprete especializada en Lied, Blanca Graciá Rodríguez ha actuado en destacados festivales internacionales como el Oxford Lieder Festival, SongEasel o el Hidalgo Festival de Múnich. Asimismo, ha sido reconocida en diversos certámenes, siendo finalista en el II Certamen Internacional de Lied y Canción (España, 2018), en el Concurso Galantes Talanti (Letonia, 2022) y en los Ashburnham English Song Awards (2025), además de obtener el tercer premio en el International Music Competition France en 2022.', 'Con esta designación, Elda reconoce el talento, la proyección internacional y la excelencia artística de una música local que llevará su experiencia y sensibilidad al frente del pasodoble Idella, aportando una nueva dimensión a este acto tan esperado y querido por el público.']
  },
  va: {
    nav: ['Inici', 'Biografia', 'Agenda', 'Media', 'Contacte'],
    panelKickers: ['', '01 · Presentació', '02 · Pròximament', '03 · Connecta', '04 · Parlem', '05 · Fotos'],
    headings: ['Inici', 'Biografia', 'Agenda', 'Xarxes Socials', 'Contacte'],
    about: ['Hola, soc Blanca. Este és el meu espai personal: un lloc per a compartir qui soc, en quins projectes estic treballant i les coses que m’inspiren.', 'Pots substituir este text per la teua presentació, la teua trajectòria i allò que vols que les persones coneguen de tu.', 'Ara mateix', 'Disponible per a noves oportunitats, col·laboracions i converses interessants.'],
    agendaIntro: 'Consulta els meus pròxims esdeveniments, reunions i espais disponibles.',
    socialIntro: 'Troba’m també en estos espais.',
    opinionsIntro: 'Recomanacions i paraules de persones amb les quals he compartit projectes.',
    contactIntro: 'Tens una idea, una proposta o simplement vols saludar? Pots escriure’m mitjançant este formulari.',
    labels: ['Nom', 'Correu electrònic', 'Missatge'],
    placeholders: ['El teu nom', 'tu@correu.com', 'Escriu el teu missatge'],
    send: 'Enviar missatge',
    pastEventsTitle: '02. Esdeveniments passats',
    auditionsTitle: 'Audicions',
    agendaCards: ['[DIA · DATA]', '[Esdeveniment o reunió]', '[Hora i lloc]'],
    pastCards: ['[DATA]', '[Esdeveniment passat]', '[Lloc o descripció]'],
    role: 'Pianista, Repetidora i Coach Vocal',
    galleryTitle: 'Galeria',
    scheduleHint: 'Mira la meua agenda',
    previousEventsTitle: 'Esdeveniments anteriors',
    upcomingTitle: 'Pròximament',
    scheduleTitle: 'Agenda',
    previousEventDate: '[DATA]',
    previousEventName: '[Nom de l’esdeveniment]',
    previousEventPlace: '[Lloc]',
    previousEventDescription: '[Descripció breu de l’esdeveniment]',
    aboutBio: ['Formada en el Conservatori Professional d’Elda “Ana María Sánchez”, va continuar els seus estudis superiors en el Conservatori Superior de Música “Joaquín Rodrigo” de València, on es va graduar amb honors en l’especialitat de Piano. La seua inquietud artística la va portar a ampliar la seua formació a Alemanya i posteriorment al Conservatori Reial d’Anvers, on va obtindre el Màster en Acompanyament Vocal i Lied amb matrícula d’honor sota la direcció de Jeanne-Minette Cilliers.', 'La seua trajectòria professional ha crescut notablement en els últims anys. Ha format part del Programa per a Joves Artistes 2023–2024 del National Opera Studio de Londres i, recentment, ha treballat com a pianista repetidora en l’English National Opera durant la temporada 2025–2026. En este context, ha participat en diverses produccions operístiques sota la direcció de mestres reconeguts com Julia Jones, Marie Jacquot, Clelia Cafiero, Yi-Chen Li, Matthew Kofi Waldren i Kerem Hasan, entre altres.', 'Com a intèrpret especialitzada en Lied, Blanca Graciá Rodríguez ha actuat en destacats festivals internacionals com l’Oxford Lieder Festival, SongEasel o el Hidalgo Festival de Munic. També ha sigut reconeguda en diversos certàmens, sent finalista en el II Certamen Internacional de Lied i Cançó (Espanya, 2018), en el Concurs Galantes Talanti (Letònia, 2022) i en els Ashburnham English Song Awards (2025), a més d’obtindre el tercer premi en l’International Music Competition France el 2022.', 'Amb esta designació, Elda reconeix el talent, la projecció internacional i l’excel·lència artística d’una música local que aportarà la seua experiència i sensibilitat al pasdoble Idella, donant una nova dimensió a este acte tan esperat i estimat pel públic.']
  }
};

if (auditionsDot && auditionsSection && socialPanel) {
  socialPanel.append(auditionsSection);
  auditionsSection.hidden = false;
}

document.querySelector('[data-content="agenda"] .panel-kicker')?.remove();
document.querySelector('[data-content="redes"] .panel-kicker')?.remove();

const linkedinLink = document.querySelector('.linkedin-logo')?.closest('.social-link');
const instagramLink = document.querySelector('.instagram-logo')?.closest('.social-link');
const facebookLink = document.querySelector('.facebook-logo')?.closest('.social-link');
const youtubeLink = document.querySelector('.youtube-logo')?.closest('.social-link');
const contactPanel = document.querySelector('[data-content="contacto"]');

if (linkedinLink) {
  linkedinLink.href = siteContent.social?.linkedin || 'https://www.linkedin.com/in/blanca-graci%C3%A1-rodr%C3%ADguez-a153ab307';
  linkedinLink.target = '_blank';
  linkedinLink.rel = 'noopener noreferrer';
}
if (instagramLink) {
  instagramLink.href = siteContent.social?.instagram || 'https://www.instagram.com/blanca.grh/';
  instagramLink.target = '_blank';
  instagramLink.rel = 'noopener noreferrer';
}
if (facebookLink) facebookLink.remove();
if (youtubeLink) {
  youtubeLink.href = siteContent.social?.youtube || 'https://www.youtube.com/@blancagraciarodriguez4952';
  youtubeLink.target = '_blank';
  youtubeLink.rel = 'noopener noreferrer';
}

document.querySelectorAll('.social-link').forEach((socialLink) => {
  socialLink.querySelector('span')?.remove();
});

document.querySelectorAll('.auditions-grid a span').forEach((label) => label.remove());

document.querySelectorAll('.social-link[href^="http"], .social-link[href^="mailto"]').forEach((socialLink) => {
  if (socialLink.classList.contains('gmail-link')) return;
  socialLink.addEventListener('click', (event) => { event.preventDefault(); showExitNotice(socialLink); });
});

if (contactPanel) {
  contactPanel.querySelector('.panel-kicker')?.remove();
  contactPanel.querySelector('h2')?.remove();
  contactPanel.querySelector(':scope > p')?.remove();
  const contactHeading = document.createElement('h2');
  contactHeading.textContent = 'Contacto';
  contactPanel.prepend(contactHeading);
  const contactIntroText = document.createElement('p');
  contactIntroText.className = 'contact-intro-text';
  contactIntroText.textContent = siteContent.contact?.intro || '¿Tienes una idea, una propuesta o simplemente quieres saludar? Puedes escribirme mediante este formulario.';
  contactHeading.after(contactIntroText);
  const socialReminder = document.createElement('div');
  socialReminder.className = 'contact-social-reminder';
  [linkedinLink, instagramLink, youtubeLink].forEach((socialLink) => {
    if (!socialLink) return;
    const logoLink = socialLink.cloneNode(true);
    logoLink.querySelector('span')?.remove();
    logoLink.querySelector('strong')?.remove();
    socialReminder.append(logoLink);
  });
  const contactEmail = siteContent.contact?.email || 'gr_blanca@hotmail.es';
  const gmailLink = document.createElement('a');
  gmailLink.className = 'social-link gmail-link';
  gmailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}`;
  gmailLink.setAttribute('aria-label', `Escribir un correo a ${contactEmail}`);
  gmailLink.innerHTML = '<svg class="social-logo gmail-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13Z" fill="none"/><path d="M5 7.2 12 13l7-5.8V18H5V7.2Z" fill="none"/><path d="m5 7 7 5.8L19 7" fill="none"/></svg>';
  gmailLink.addEventListener('click', (event) => { event.preventDefault(); showExitNotice(gmailLink); });
  socialReminder.append(gmailLink);
  contactPanel.append(socialReminder);
}

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.action = `https://formsubmit.co/${siteContent.contact?.email || 'gr_blanca@hotmail.es'}`;
  contactForm.method = 'POST';
}

document.querySelectorAll('.contact-social-reminder .social-link').forEach((socialLink) => {
  socialLink.addEventListener('click', (event) => { event.preventDefault(); showExitNotice(socialLink); });
});

const defaultAuditions = [
  { title: 'Audición 1', youtubeUrl: 'https://www.youtube.com/watch?v=GKI2NcM75Xw' },
  { title: 'Audición 2', youtubeUrl: 'https://www.youtube.com/watch?v=kO8jUgePnX4' }
];
const auditions = (siteContent.auditions?.length ? siteContent.auditions : defaultAuditions).map((item) => ({
  title: item.title,
  youtubeUrl: item.youtubeUrl,
  videoId: getYouTubeId(item.youtubeUrl)
})).filter((item) => item.videoId);
const auditionsGrid = document.querySelector('#auditions-section .auditions-grid');
if (auditionsGrid) {
  auditionsGrid.innerHTML = auditions.map((item, index) => `<a href="https://www.youtube.com/watch?v=${item.videoId}" target="_blank" rel="noopener noreferrer"><img src="https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg" alt="Ver ${item.title} en YouTube"><span>${item.title || `Audición ${index + 1}`}</span></a>`).join('');
}
const defaultGalleryPhotos = [
  { image: 'images/collage /Blanca_Color-3.jpg', alt: 'Blanca Graciá, fotografía en color 3' },
  { image: 'images/collage /Blanca_Color-6.jpg', alt: 'Blanca Graciá, fotografía en color 6' },
  { image: 'images/collage /Blanca_Color-12.jpg', alt: 'Blanca Graciá, fotografía en color 12' },
  { image: 'images/collage /Blanca_Color-11.jpg', alt: 'Blanca Graciá, fotografía en color 11' },
  { image: 'images/esta-tambien.jpeg', alt: 'Blanca Graciá en una actuación' },
  { image: 'images/Example02.jpg', alt: 'Blanca Graciá al piano' }
];
const galleryPhotos = siteContent.gallery?.length ? siteContent.gallery : defaultGalleryPhotos;

const gallerySection = document.createElement('section');
gallerySection.className = 'content-panel gallery-section';
gallerySection.classList.add('gallery-section');
gallerySection.innerHTML = `<div class="gallery-heading"><h3>Audiciones</h3><button class="gallery-next" type="button" aria-label="Siguiente collage">→</button><span class="gallery-page-indicator">1/2</span></div><div class="gallery-page gallery-page-one"><div class="gallery-grid">${auditions.map((item) => `<figure class="gallery-item"><a class="audition-link" href="https://www.youtube.com/watch?v=${item.videoId}" target="_blank" rel="noopener noreferrer"><img src="https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg" alt="${item.title}"></a></figure>`).join('')}</div></div><div class="gallery-page gallery-page-two" hidden><button class="gallery-back" type="button">← Volver a audiciones</button><div class="gallery-grid">${galleryPhotos.map((photo) => `<figure class="gallery-item"><img src="${toImageUrl(photo.image)}" alt="${photo.alt || ''}"></figure>`).join('')}</div></div>`;
const galleryPageOne = gallerySection.querySelector('.gallery-page-one');
const galleryPageTwo = gallerySection.querySelector('.gallery-page-two');
const galleryNext = gallerySection.querySelector('.gallery-next');
const galleryBack = gallerySection.querySelector('.gallery-back');
const galleryPageIndicator = gallerySection.querySelector('.gallery-page-indicator');
galleryNext.addEventListener('click', () => {
  galleryPageOne.classList.add('gallery-page-transition-out-left');
  window.setTimeout(() => {
    galleryPageOne.hidden = true;
    galleryPageOne.classList.remove('gallery-page-transition-out-left');
    galleryPageTwo.hidden = false;
    galleryPageTwo.classList.add('gallery-page-transition-in-right');
  }, 300);
  gallerySection.querySelector('.gallery-heading h3').textContent = 'Galería';
  galleryPageIndicator.textContent = '2/2';
  galleryNext.hidden = true;
});
galleryBack.addEventListener('click', () => {
  galleryPageTwo.classList.add('gallery-page-transition-out-right');
  window.setTimeout(() => {
    galleryPageTwo.hidden = true;
    galleryPageTwo.classList.remove('gallery-page-transition-out-right');
    galleryPageOne.hidden = false;
    galleryPageOne.classList.add('gallery-page-transition-in-left');
  }, 300);
  gallerySection.querySelector('.gallery-heading h3').textContent = 'Audiciones';
  galleryPageIndicator.textContent = '1/2';
  galleryNext.hidden = false;
  updateRecordingLabels(document.documentElement.lang);
});
gallerySection.classList.add('content-panel');
gallerySection.hidden = false;
document.querySelector('.site-shell').append(gallerySection);
buttons = document.querySelectorAll('[data-panel]');
panels = document.querySelectorAll('[data-content]');
gallerySection.remove();
buttons = document.querySelectorAll('[data-panel]');
panels = document.querySelectorAll('[data-content]');
const galleryArrow = document.createElement('button');
galleryArrow.type = 'button';
galleryArrow.className = 'gallery-arrow';
galleryArrow.setAttribute('aria-expanded', 'false');
galleryArrow.setAttribute('aria-label', 'Abrir galería');
galleryArrow.textContent = 'Click aquí';
auditionsSection.append(galleryArrow);
galleryArrow.addEventListener('click', () => {
  const galleryIsOpen = !gallerySection.hidden;
  gallerySection.hidden = galleryIsOpen;
  galleryArrow.setAttribute('aria-expanded', String(!galleryIsOpen));
  galleryArrow.textContent = galleryIsOpen ? 'Volver a audiciones' : 'Click aquí';
  gallerySection.classList.remove('gallery-slide-in', 'gallery-fade-out');
  if (!galleryIsOpen) {
    gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    auditionsSection.classList.remove('auditions-fade-in');
    void auditionsSection.offsetWidth;
    auditionsSection.classList.add('auditions-fade-in');
    auditionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

gallerySection.hidden = false;
galleryArrow.remove();
socialPanel?.append(gallerySection);
buttons = document.querySelectorAll('[data-panel]');
panels = document.querySelectorAll('[data-content]');

const schedulePanel = document.querySelector('[data-content="agenda"]');
const scheduleSection = document.createElement('section');
scheduleSection.className = 'schedule-section';
scheduleSection.innerHTML = '<h3>Schedule</h3><a class="full-calendar-link" href="' + notionScheduleUrl + '" target="_blank" rel="noopener noreferrer"><div class="calendar-preview-heading"><span>NOTION CALENDAR</span><strong>Schedule</strong></div><div class="calendar-preview-grid"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="calendar-preview-action">Abrir calendario completo y pasar meses en Notion ↗</span></a>';
schedulePanel.append(scheduleSection);

schedulePanel.querySelector('h2')?.remove();
schedulePanel.querySelector(':scope > p')?.remove();
schedulePanel.querySelector(':scope > .agenda-grid')?.remove();
schedulePanel.querySelector(':scope > .past-events')?.remove();

const scheduleHeading = scheduleSection.querySelector('h3');
const calendarLogo = document.createElement('span');
calendarLogo.className = 'calendar-logo-link';
calendarLogo.setAttribute('aria-hidden', 'true');
calendarLogo.innerHTML = '<svg class="calendar-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="1.5"></rect><path d="M7 3v4M17 3v4M3 9h18M7 13h.01M12 13h.01M17 13h.01M7 17h.01M12 17h.01M17 17h.01"></path></svg>';
scheduleHeading.append(calendarLogo);
const scheduleTitleLink = document.createElement('a');
scheduleTitleLink.className = 'schedule-title-link';
scheduleTitleLink.href = notionScheduleUrl;
scheduleTitleLink.target = '_blank';
scheduleTitleLink.rel = 'noopener noreferrer';
scheduleTitleLink.textContent = 'Schedule';
scheduleHeading.firstChild.replaceWith(scheduleTitleLink);
scheduleTitleLink.append(calendarLogo);
const scheduleHint = document.createElement('p');
scheduleHint.className = 'schedule-hint';
scheduleHint.textContent = 'Mira mi agenda';
scheduleHeading.after(scheduleHint);
const upcomingTitle = document.createElement('h4');
upcomingTitle.className = 'upcoming-title';
upcomingTitle.textContent = 'Próximamente';
const defaultUpcoming = [
  { link: '', type: '[Tipo de trabajo]', date: '[Fecha o fechas]', place: '[Lugar]', description: '[Descripción del evento]' },
  { link: '', type: '[Tipo de trabajo]', date: '[Fecha o fechas]', place: '[Lugar]', description: '[Descripción del evento]' },
  { link: '', type: '[Tipo de trabajo]', date: '[Fecha o fechas]', place: '[Lugar]', description: '[Descripción del evento]' }
];
const upcomingItems = siteContent.agenda?.upcoming?.length ? siteContent.agenda.upcoming : defaultUpcoming;
const upcomingEvents = document.createElement('div');
upcomingEvents.className = 'upcoming-events';
upcomingEvents.innerHTML = upcomingItems.map((item) => `<article class="upcoming-event"><a href="${item.link || '#'}" class="upcoming-event-link">${item.link ? 'Más información' : '[Añadir enlace]'}</a><strong>${item.type}</strong><time>${item.date}</time><span>${item.place}</span><p>${item.description}</p></article>`).join('');
const upcomingSection = document.createElement('section');
upcomingSection.className = 'upcoming-section';
upcomingSection.append(upcomingTitle, upcomingEvents);
schedulePanel.prepend(upcomingSection);
const defaultPrevious = [
  { date: '[FECHA]', name: '[Nombre del evento]', place: '[Lugar]', description: '[Descripción breve del evento]' },
  { date: '[FECHA]', name: '[Nombre del evento]', place: '[Lugar]', description: '[Descripción breve del evento]' },
  { date: '[FECHA]', name: '[Nombre del evento]', place: '[Lugar]', description: '[Descripción breve del evento]' }
];
const previousItems = siteContent.agenda?.previous?.length ? siteContent.agenda.previous : defaultPrevious;
const previousEvents = document.createElement('section');
previousEvents.className = 'previous-events-card';
previousEvents.innerHTML = `<img class="previous-events-photo" src="images/NOS%20C.jpg" alt="Blanca Graciá Rodríguez durante una actuación"><h4>Eventos anteriores</h4><div class="previous-events-list">${previousItems.map((item) => `<article><time>${item.date}</time><strong>${item.name}</strong><span>${item.place}</span><p>${item.description}</p></article>`).join('')}</div>`;
scheduleHint.after(previousEvents);
const calendarPreview = scheduleSection.querySelector('.full-calendar-link');
calendarPreview.remove();

homePanel.className = 'content-panel home-panel';

gallerySection.querySelectorAll('.gallery-grid a:not(.audition-link)').forEach((imageLink) => {
  imageLink.removeAttribute('href');
  imageLink.removeAttribute('target');
  imageLink.addEventListener('click', (event) => event.preventDefault());
  imageLink.addEventListener('contextmenu', (event) => event.preventDefault());
  imageLink.addEventListener('dragstart', (event) => event.preventDefault());
});

const panelStage = document.createElement('div');
panelStage.className = 'panel-stage';
panels.forEach((panel) => { if (panel.isConnected) panelStage.append(panel); });
document.querySelector('.section-nav').after(panelStage);
buttons = document.querySelectorAll('[data-panel]');
panels = document.querySelectorAll('[data-content]');

const sectionNav = document.querySelector('.section-nav');
let navigationHideTimer;
let previousScrollY = window.scrollY;
let previousMouseY;

const showSectionNav = () => {
  window.clearTimeout(navigationHideTimer);
  sectionNav?.classList.remove('nav-hidden');
};

const scheduleNavigationHide = () => {
  window.clearTimeout(navigationHideTimer);
  if (window.scrollY <= 0) {
    showSectionNav();
    return;
  }
  navigationHideTimer = window.setTimeout(() => {
    sectionNav?.classList.add('nav-hidden');
  }, 2000);
};

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  if (currentScrollY < previousScrollY) {
    showSectionNav();
  } else if (currentScrollY > previousScrollY) {
    scheduleNavigationHide();
  }
  previousScrollY = currentScrollY;
}, { passive: true });

window.addEventListener('mousemove', (event) => {
  if (previousMouseY !== undefined && event.clientY < previousMouseY) showSectionNav();
  previousMouseY = event.clientY;
});

function showPanel(panelName, direction = 'forward') {
  const profileOverlay = document.querySelector('.profile-overlay');
  if (profileOverlay) {
    window.clearTimeout(profileOverlayHideTimer);
    if (panelName === 'inicio') {
      profileOverlay.hidden = false;
      profileOverlay.style.setProperty('display', 'flex', 'important');
      profileOverlay.classList.remove('is-fading-out');
    } else if (!profileOverlay.hidden) {
      profileOverlay.classList.add('is-fading-out');
      profileOverlayHideTimer = window.setTimeout(() => {
        profileOverlay.hidden = true;
        profileOverlay.style.setProperty('display', 'none', 'important');
      }, 500);
    }
  }
  buttons.forEach((button) => {
    const isActive = button.dataset.panel === panelName;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  panels.forEach((panel) => {
    const isActive = panel.dataset.content === panelName;
    panel.hidden = !isActive;
    panel.setAttribute('aria-hidden', String(!isActive));
    if (isActive) {
      panel.classList.remove('panel-enter', 'panel-enter-forward', 'panel-enter-back');
      void panel.offsetWidth;
      panel.classList.add('panel-enter', direction === 'back' ? 'panel-enter-back' : 'panel-enter-forward');
    }
  });

  if (homeAboutArrow) {
    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    const showAboutArrow = !isMobile && (panelName === 'inicio' || panelName === 'sobre-mi');
    homeAboutArrow.style.setProperty('display', showAboutArrow ? 'grid' : 'none', 'important');
    const isAbout = panelName === 'sobre-mi';
    homeAboutArrow.classList.toggle('is-about', isAbout);
    homeAboutArrow.textContent = isAbout ? '↑' : '↓';
    homeAboutArrow.setAttribute('aria-label', isAbout ? 'Volver a Inicio' : 'Ir a Biografía');
    (isAbout ? aboutPanel : document.querySelector('.site-header'))?.append(homeAboutArrow);
  }
}

const sectionArrowOrder = ['inicio', 'sobre-mi', 'agenda', 'redes', 'contacto'];
const sectionArrowNames = {
  inicio: 'Inicio',
  'sobre-mi': 'Biografía',
  agenda: 'Agenda',
  redes: 'Media',
  contacto: 'Contacto'
};
const sectionPanels = Object.fromEntries([...panels].map((panel) => [panel.dataset.content, panel]));
const mobileSectionControls = document.createElement('nav');
mobileSectionControls.className = 'mobile-section-controls';
mobileSectionControls.setAttribute('aria-label', 'Navegación de secciones');
mobileSectionControls.innerHTML = '<button class="mobile-section-previous" type="button" aria-label="Sección anterior">‹</button><span class="mobile-section-indicator">1/5</span><button class="mobile-section-next" type="button" aria-label="Sección siguiente">›</button><button class="mobile-return-start" type="button">Volver al principio</button>';
document.body.append(mobileSectionControls);
const updateMobileSectionControls = (currentName) => {
  const currentIndex = sectionArrowOrder.indexOf(currentName);
  if (currentName === 'inicio') document.querySelector('.profile-overlay')?.append(mobileSectionControls);
  else sectionPanels[currentName]?.append(mobileSectionControls);
  const previous = mobileSectionControls.querySelector('.mobile-section-previous');
  const next = mobileSectionControls.querySelector('.mobile-section-next');
  mobileSectionControls.querySelector('.mobile-section-indicator').textContent = `${currentIndex + 1}/5`;
  previous.disabled = currentIndex === 0;
  next.disabled = currentIndex === sectionArrowOrder.length - 1;
  mobileSectionControls.querySelector('.mobile-return-start').hidden = currentName !== 'contacto';
};
mobileSectionControls.querySelector('.mobile-section-previous').addEventListener('click', () => navigateWithSectionArrow(sectionArrowOrder[sectionArrowOrder.indexOf(document.querySelector('.section-nav button.active')?.dataset.panel)], -1));
mobileSectionControls.querySelector('.mobile-section-next').addEventListener('click', () => navigateWithSectionArrow(sectionArrowOrder[sectionArrowOrder.indexOf(document.querySelector('.section-nav button.active')?.dataset.panel)], 1));
mobileSectionControls.querySelector('.mobile-return-start').addEventListener('click', () => { showPanel('inicio', 'back'); updateMobileSectionControls('inicio'); window.history.replaceState(null, '', '#inicio'); window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); });
const navigateWithSectionArrow = (currentName, direction) => {
  const currentIndex = sectionArrowOrder.indexOf(currentName);
  const targetName = sectionArrowOrder[currentIndex + direction];
  if (!targetName) return;
  const targetPanel = sectionPanels[targetName];
  showPanel(targetName, direction > 0 ? 'forward' : 'back');
  updateMobileSectionControls(targetName);
  window.history.replaceState(null, '', `#${targetName}`);
  if (targetName === 'inicio') window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  else targetPanel?.scrollIntoView({ behavior: 'smooth', block: direction < 0 ? 'end' : 'start' });
};
const addDesktopSectionArrow = (panelName, direction, className) => {
  if (!window.matchMedia('(min-width: 701px)').matches) return;
  const panel = sectionPanels[panelName];
  if (!panel) return;
  const arrow = document.createElement('button');
  arrow.className = className;
  arrow.type = 'button';
  arrow.textContent = direction > 0 ? '→' : '←';
  const targetName = sectionArrowOrder[sectionArrowOrder.indexOf(panelName) + direction];
  arrow.setAttribute('aria-label', `${direction > 0 ? 'Ir a' : 'Volver a'} ${sectionArrowNames[targetName]}`);
  panel.append(arrow);
  arrow.addEventListener('click', () => navigateWithSectionArrow(panelName, direction));
};
addDesktopSectionArrow('sobre-mi', 1, 'section-next-arrow');
addDesktopSectionArrow('agenda', -1, 'section-previous-arrow');
addDesktopSectionArrow('agenda', 1, 'section-next-arrow');
addDesktopSectionArrow('redes', -1, 'section-previous-arrow');
addDesktopSectionArrow('redes', 1, 'section-next-arrow');
addDesktopSectionArrow('contacto', -1, 'section-previous-arrow');
buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const activeButton = [...buttons].find((item) => item.classList.contains('active'));
    const currentIndex = [...buttons].indexOf(activeButton);
    const targetIndex = [...buttons].indexOf(button);
    const movesLeft = targetIndex < currentIndex || (activeButton?.dataset.panel === 'contacto' && button.dataset.panel === 'gallery') || (activeButton?.dataset.panel === 'gallery' && button.dataset.panel === 'redes');
    const movesRight = activeButton?.dataset.panel === 'redes' && button.dataset.panel === 'gallery';
    showPanel(button.dataset.panel, movesRight ? 'forward' : (movesLeft ? 'back' : 'forward'));
    updateMobileSectionControls(button.dataset.panel);
    window.history.replaceState(null, '', `#${button.dataset.panel}`);
    const targetPanel = [...panels].find((panel) => panel.dataset.content === button.dataset.panel);
    if (button.dataset.panel === 'inicio') {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } else {
      targetPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

function setLanguage(language) {
  const copy = translations[language];
  document.documentElement.lang = language;
  const navLabels = {
    inicio: copy.nav[0],
    'sobre-mi': copy.nav[1],
    agenda: copy.nav[2],
    redes: copy.nav[3],
    contacto: copy.nav[4],
    gallery: copy.nav[5]
  };
  [...document.querySelectorAll('[data-panel]')].filter((button) => button.isConnected).forEach((button) => {
    button.textContent = navLabels[button.dataset.panel] || button.textContent;
  });
  const panelIndexes = {
    inicio: 0,
    'sobre-mi': 1,
    agenda: 2,
    redes: 3,
    contacto: 4,
    gallery: 5
  };
  [...document.querySelectorAll('[data-content]')].filter((panel) => panel.isConnected).forEach((panel) => {
     const panelIndex = panelIndexes[panel.dataset.content];
     const panelKicker = panel.querySelector('.panel-kicker');
     const panelHeading = panel.querySelector('h2');
     if (panelKicker) panelKicker.textContent = copy.panelKickers[panelIndex];
     if (panelHeading) panelHeading.textContent = copy.headings[panelIndex];
  });
  const about = document.querySelector('[data-content="sobre-mi"]');
  about.querySelectorAll('.about-intro > p:not(.panel-kicker)').forEach((item, index) => { item.textContent = copy.aboutBio[index]; });
  const headerRole = document.querySelector('.header-role');
  if (headerRole) headerRole.textContent = copy.role;
  const agendaIntro = document.querySelector('[data-content="agenda"] > p:not(.panel-kicker)');
  if (agendaIntro) agendaIntro.textContent = copy.agendaIntro;
  document.querySelector('[data-content="redes"] > p:not(.panel-kicker)').textContent = copy.socialIntro;
  const contactIntro = document.querySelector('[data-content="contacto"] > p:not(.panel-kicker)');
  if (contactIntro) contactIntro.textContent = copy.contactIntro;
  document.querySelectorAll('.contact-form label').forEach((label, index) => { label.firstChild.textContent = copy.labels[index]; });
  document.querySelectorAll('.contact-form input:not([type="hidden"]), .contact-form textarea').forEach((field, index) => { field.placeholder = copy.placeholders[index] || ''; });
  document.querySelector('.contact-form button').textContent = copy.send;
  const pastEventsTitle = document.querySelector('[data-translate="pastEventsTitle"]');
  if (pastEventsTitle) pastEventsTitle.textContent = copy.pastEventsTitle;
  document.querySelector('.auditions-section h3').textContent = copy.auditionsTitle;
  gallerySection.querySelector('.gallery-heading h3').textContent = galleryPageTwo.hidden ? copy.auditionsTitle : copy.galleryTitle;
  document.querySelectorAll('.schedule-hint').forEach((hint) => { hint.textContent = copy.scheduleHint; });
  upcomingTitle.textContent = copy.upcomingTitle;
  document.querySelectorAll('.schedule-title-link').forEach((titleLink) => {
    if (titleLink.firstChild) titleLink.firstChild.textContent = copy.scheduleTitle;
  });
  document.querySelectorAll('.previous-events-card h4').forEach((title) => { title.textContent = copy.previousEventsTitle; });
  document.querySelectorAll('.agenda-grid .agenda-card').forEach((card) => {
    card.querySelector('time').textContent = copy.agendaCards[0];
    card.querySelector('strong').textContent = copy.agendaCards[1];
    card.querySelector('span').textContent = copy.agendaCards[2];
  });
  document.querySelectorAll('.past-events-list article').forEach((card) => {
    card.querySelector('time').textContent = copy.pastCards[0];
    card.querySelector('strong').textContent = copy.pastCards[1];
    card.querySelector('span').textContent = copy.pastCards[2];
  });
  languageButtons.forEach((button) => button.classList.toggle('active', button.dataset.language === language));
}

languageButtons.forEach((button) => button.addEventListener('click', () => { setLanguage(button.dataset.language); updateRecordingLabels(button.dataset.language); }));

aboutDownButton?.addEventListener('click', () => {
  const isOpen = !aboutPhoto.hidden;
  aboutPhoto.hidden = isOpen;
  auditionsDot.hidden = isOpen;
  auditionsDot.classList.toggle('is-unlocked', !isOpen);
  if (isOpen) {
    auditionsSection.hidden = true;
    auditionsDot.setAttribute('aria-expanded', 'false');
  }
  aboutDownButton.setAttribute('aria-expanded', String(!isOpen));
  aboutDownButton.setAttribute('aria-label', isOpen ? 'Ocultar foto' : 'Mostrar foto');
  aboutDownButton.textContent = '↓';
  if (!isOpen) aboutPhoto.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

auditionsDot.hidden = true;
auditionsDot.classList.remove('is-unlocked');
auditionsDot.textContent = '→';

auditionsDot.addEventListener('click', () => {
  const isOpen = !auditionsSection.hidden;
  auditionsSection.hidden = isOpen;
  auditionsDot.setAttribute('aria-expanded', String(!isOpen));
  if (!isOpen) auditionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
window.history.replaceState(null, '', '#inicio');
showPanel('inicio', 'forward');
updateMobileSectionControls('inicio');
if (siteContent.bio?.paragraphs?.length) translations.es.aboutBio = siteContent.bio.paragraphs;
if (siteContent.contact?.intro) translations.es.contactIntro = siteContent.contact.intro;
setLanguage('es');

translations.es.auditionsTitle = 'Grabaciones';
translations.en.auditionsTitle = 'Recordings';
translations.va.auditionsTitle = 'Gravacions';
const recordingLabels = { es: 'Grabaciones', en: 'Recordings', va: 'Gravacions' };
const updateRecordingLabels = (language = 'es') => {
  const label = recordingLabels[language] || recordingLabels.es;
  document.querySelector('.auditions-section h3')?.replaceChildren(document.createTextNode(label));
  gallerySection.querySelector('.gallery-heading h3').textContent = galleryPageTwo.hidden ? label : translations[language].galleryTitle;
  gallerySection.querySelector('.gallery-back').textContent = language === 'en' ? '← Back to recordings' : language === 'va' ? '← Tornar a les gravacions' : '← Volver a "Grabaciones"';
  document.querySelector('.auditions-dot')?.setAttribute('aria-label', language === 'en' ? 'Show recordings' : language === 'va' ? 'Mostrar gravacions' : 'Mostrar grabaciones');
  document.querySelectorAll('#auditions-section .auditions-grid span').forEach((item, index) => { item.textContent = `${language === 'en' ? 'Recording' : language === 'va' ? 'Gravació' : 'Grabación'} ${index + 1}`; });
};
updateRecordingLabels('es');

if (window.matchMedia('(max-width: 700px)').matches) {
  [...document.querySelectorAll('.section-nav button, .language-switcher button')].forEach((button) => {
    button.style.setProperty('font-family', '"Space Mono", monospace', 'important');
    button.style.setProperty('font-size', '6px', 'important');
    button.style.setProperty('font-weight', '700', 'important');
  });
}

document.querySelectorAll('body *').forEach((element) => {
  [...element.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('undefined')) node.textContent = node.textContent.replace(/undefined/gi, '');
  });
});

