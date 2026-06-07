/* 
   -----------------------------------
   Modal Logic (Sign In with Shop) 
   -----------------------------------
*/
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalContainer = document.getElementById('modal-container');
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');

let isModalOpen = false;

function openModal(e) {
    if (e) e.preventDefault();
    if (isModalOpen) return;
    isModalOpen = true;

    modalContainer.classList.remove('invisible', 'pointer-events-none');

    requestAnimationFrame(() => {
        modalContainer.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100');
    });

    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (!isModalOpen) return;
    isModalOpen = false;

    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95', 'opacity-0');
    modalContainer.classList.add('opacity-0');

    setTimeout(() => {
        if (!isModalOpen) {
            modalContainer.classList.add('invisible', 'pointer-events-none');
        }
    }, 300);

    document.body.style.overflow = '';
}

if (openModalBtn) openModalBtn.addEventListener('click', openModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen) {
        closeModal();
    }
});

if (modalContent) {
    modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}


/* 
   -----------------------------------
   Hero Slider Logic 
   -----------------------------------
*/

const slides = document.querySelectorAll('.slide');
const nextBtn = document.querySelector('.next-slide');
const prevBtn = document.querySelector('.prev-slide');
let currentSlide = 0;
const slideInterval = 5000;

function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
}

function nextSlide() {
    goToSlide(currentSlide + 1);
}

function prevSlide() {
    goToSlide(currentSlide - 1);
}

if (nextBtn) nextBtn.addEventListener('click', () => {
    nextSlide();
    resetTimer();
});

if (prevBtn) prevBtn.addEventListener('click', () => {
    prevSlide();
    resetTimer();
});

let slideTimer = setInterval(nextSlide, slideInterval);

function resetTimer() {
    clearInterval(slideTimer);
    slideTimer = setInterval(nextSlide, slideInterval);
}

/* 
   -----------------------------------
   Mobile Menu Logic 
   -----------------------------------
*/
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const nav = document.querySelector('.desktop-nav');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        if (nav.style.display === 'block') {
            nav.style.display = 'none';
        } else {
            nav.style.display = 'block';
            nav.style.position = 'absolute';
            nav.style.top = '100%';
            nav.style.left = '0';
            nav.style.width = '100%';
            nav.style.background = '#fff';
            nav.style.padding = '20px';
            nav.style.boxShadow = '0 5px 10px rgba(0,0,0,0.1)';
            nav.style.zIndex = '99';

            const ul = nav.querySelector('ul');
            if (ul) {
                ul.style.flexDirection = 'column';
                ul.style.gap = '15px';
            }
        }
    });
}

/* 
   -----------------------------------
   Color Swatch Logic 
   -----------------------------------
*/

const colorSwatches = document.querySelectorAll('.swatch');

colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', function (e) {
        // Find parent container to scope the change
        const parentCard = this.closest('.swatches-color');

        // Remove active class from siblings
        parentCard.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));

        // Add active class to clicked
        this.classList.add('active');
    });
});
