const rupee = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
});

const formatRupee = (value) => rupee.format(Math.round(value));

window.addEventListener("load", () => {
    const loader = document.getElementById("loader");

    if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => loader.remove(), 350);
    }
});

const navbar = document.getElementById("navbar");

const updateNavbar = () => {
    if (!navbar) return;
    navbar.classList.toggle("scrolled", window.scrollY > 24);
};

window.addEventListener("scroll", updateNavbar, { passive: true });
updateNavbar();

document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
        const target = document.querySelector(button.dataset.scroll);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

const counters = document.querySelectorAll(".counter");

const runCounter = (counter) => {
    const target = Number(counter.dataset.target || 0);
    const duration = 1200;
    const startedAt = performance.now();

    const update = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        counter.textContent = value.toLocaleString("en-IN");

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            counter.textContent = target.toLocaleString("en-IN");
        }
    };

    requestAnimationFrame(update);
};

if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runCounter(entry.target);
            counterObserver.unobserve(entry.target);
        });
    }, { threshold: 0.45 });

    counters.forEach((counter) => counterObserver.observe(counter));
} else {
    counters.forEach(runCounter);
}

document.querySelectorAll(".item button").forEach((button) => {
    button.setAttribute("aria-expanded", "false");

    button.addEventListener("click", () => {
        const item = button.parentElement;
        const isActive = item.classList.contains("active");

        document.querySelectorAll(".item").forEach((entry) => {
            entry.classList.remove("active");
            const trigger = entry.querySelector("button");
            if (trigger) trigger.setAttribute("aria-expanded", "false");
        });

        if (!isActive) {
            item.classList.add("active");
            button.setAttribute("aria-expanded", "true");
        }
    });
});

const loanAmount = document.getElementById("loanAmount");
const interestRate = document.getElementById("interestRate");
const tenure = document.getElementById("tenure");
const loanValue = document.getElementById("loanValue");
const interestValue = document.getElementById("interestValue");
const tenureValue = document.getElementById("tenureValue");
const emiValue = document.getElementById("emi");
const principalTotal = document.getElementById("principalTotal");
const interestTotal = document.getElementById("interestTotal");
const payableTotal = document.getElementById("payableTotal");
const chartCanvas = document.getElementById("emiChart");

let emiChart;

const calculateEmi = () => {
    if (!loanAmount || !interestRate || !tenure || !emiValue) return;

    const principal = Number(loanAmount.value);
    const annualRate = Number(interestRate.value);
    const years = Number(tenure.value);
    const months = years * 12;
    const monthlyRate = annualRate / 12 / 100;

    const emi = monthlyRate === 0
        ? principal / months
        : principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);

    const totalPayable = emi * months;
    const totalInterest = totalPayable - principal;

    loanValue.textContent = formatRupee(principal);
    interestValue.textContent = `${annualRate.toFixed(annualRate % 1 === 0 ? 0 : 1)}%`;
    tenureValue.textContent = `${years} ${years === 1 ? "Year" : "Years"}`;
    emiValue.textContent = formatRupee(emi);
    principalTotal.textContent = formatRupee(principal);
    interestTotal.textContent = formatRupee(totalInterest);
    payableTotal.textContent = formatRupee(totalPayable);

    updateChart(principal, totalInterest);
};

const updateChart = (principal, interest) => {
    if (!chartCanvas) return;

    const data = [Math.round(principal), Math.max(Math.round(interest), 0)];

    if (typeof Chart === "undefined") {
        drawFallbackChart(data);
        return;
    }

    if (emiChart) {
        emiChart.data.datasets[0].data = data;
        emiChart.update();
        return;
    }

    emiChart = new Chart(chartCanvas, {
        type: "doughnut",
        data: {
            labels: ["Principal", "Interest"],
            datasets: [{
                data,
                backgroundColor: ["#facc15", "#f97316"],
                borderColor: "#ffffff",
                borderWidth: 4,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#172033",
                        boxWidth: 12,
                        padding: 18,
                        font: {
                            family: "Inter",
                            weight: "700"
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${formatRupee(context.raw)}`
                    }
                }
            }
        }
    });
};

const drawFallbackChart = ([principal, interest]) => {
    const context = chartCanvas.getContext("2d");
    const width = chartCanvas.width = chartCanvas.clientWidth || 420;
    const height = chartCanvas.height = chartCanvas.clientHeight || 220;
    const total = Math.max(principal + interest, 1);
    const centerX = width / 2;
    const centerY = height / 2 - 12;
    const radius = Math.min(width, height) * 0.32;
    const ring = Math.max(radius * 0.34, 22);
    let start = -Math.PI / 2;

    context.clearRect(0, 0, width, height);
    context.lineWidth = ring;
    context.lineCap = "round";

    [
        { value: principal, color: "#facc15" },
        { value: interest, color: "#f97316" }
    ].forEach((item) => {
        const end = start + (item.value / total) * Math.PI * 2;
        context.beginPath();
        context.strokeStyle = item.color;
        context.arc(centerX, centerY, radius, start, end);
        context.stroke();
        start = end;
    });

    context.fillStyle = "#172033";
    context.font = "700 14px Inter, sans-serif";
    context.textAlign = "center";
    context.fillText("Principal", centerX - 74, height - 24);
    context.fillText("Interest", centerX + 74, height - 24);

    context.fillStyle = "#facc15";
    context.fillRect(centerX - 130, height - 33, 12, 12);
    context.fillStyle = "#f97316";
    context.fillRect(centerX + 16, height - 33, 12, 12);
};

[loanAmount, interestRate, tenure].forEach((input) => {
    if (input) input.addEventListener("input", calculateEmi);
});

calculateEmi();

if (typeof ScrollReveal !== "undefined") {
    ScrollReveal().reveal(
        ".hero-left,.hero-right,.feature-card,.loan-card,.steps div,.calculator-container,.faq,.contact-grid",
        {
            distance: "24px",
            duration: 700,
            origin: "bottom",
            interval: 60,
            cleanup: true
        }
    );
}

const form = document.querySelector("form");

if (form) {
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const button = form.querySelector("button");
        const originalText = button.textContent.trim();

        button.textContent = "Request Received";
        button.disabled = true;

        setTimeout(() => {
            form.reset();
            button.textContent = originalText;
            button.disabled = false;
        }, 1800);
    });
}
