"use strict";

const TOTAL_LAPS = 10;
const LAP_DELAY_MS = 900;

const TYRES = {
    soft: { name: "Меки", offset: -0.9, wearPerLap: 0.22 },
    hard: { name: "Тврди", offset: 0.5, wearPerLap: 0.06 }
};

class Driver {
    constructor(name, team, pace, skill) {
        this.name = name;
        this.team = team;
        this.pace = pace;
        this.skill = skill;
        this.tyre = Math.random() < 0.5 ? TYRES.soft : TYRES.hard;
        this.tyreAge = 0;
        this.total = 0;
        this.lapsDone = 0;
        this.out = false;
        this.pitted = false;
        this.pitOnLap = 3 + Math.floor(Math.random() * 6);
        this.statusStart = "Спремен";
        this.statusEnd = "Спремен";
        this.isWinner = false;
    }

    runLap(safetyCar) {
        let t = 92 - this.pace * 0.12 - this.skill * 0.08 + Math.random() * 2.5;
        t += this.tyre.offset + this.tyreAge * this.tyre.wearPerLap;

        if (safetyCar) {
            t += 9;
        }
        return t;
    }

    changeTyres() {
        this.tyre = (this.tyre === TYRES.soft) ? TYRES.hard : TYRES.soft;
        this.tyreAge = 0;
        this.total += 20 + Math.random() * 3;
        this.pitted = true;
    }
}

const grid = [
    new Driver("Стефан Трајковски", "Вардар Рејсинг", 89, 76),
    new Driver("Александар Миленкоски", "Кичево Рејсерс", 92, 95),
    new Driver("Марко Стојановски", "Водно Моторс", 86, 79),
    new Driver("Дарко Петровски", "Тркаленд-Драчево", 91, 84),
    new Driver("Никола Јанев", "Охрид Спид", 78, 74),
    new Driver("Филип Димитриевски", "Штипска Брзина", 88, 82),
    new Driver("Влатко Георгиев", "Тиквеш 1", 76, 66),
    new Driver("Горан Ристовски", "Формула-Каменица", 90, 91),
    new Driver("Мартин Наумов", "Пелистер Тим", 80, 75),
    new Driver("Бојан Талески", "Македонски Брод-Тркачки Тим", 90, 78)
];

let lap = 0;
let leaderName = null;
let raceOver = false;

const boardBody = document.getElementById("boardBody");
const eventLog = document.getElementById("eventLog");
const lapCounter = document.getElementById("lapCounter");
const btnNext = document.getElementById("btnNext");
const btnReset = document.getElementById("btnReset");
const winnerBox = document.getElementById("winnerBox");

function formatTime(sec) {
    const minutes = Math.floor(sec / 60);
    const rest = (sec - minutes * 60).toFixed(2).padStart(5, "0");
    return minutes + ":" + rest;
}

function sortGrid() {
    grid.sort((a, b) => {
        if (a.out !== b.out) {
            return a.out ? 1 : -1;
        }
        if (a.out && b.out) {
            return b.lapsDone - a.lapsDone || a.total - b.total;
        }
        return a.total - b.total;
    });
}

function drawBoard() {
    const leaderTime = grid[0].total;
    let html = "";

    grid.forEach((d, i) => {
        let cls = "";
        if (d.out) cls = "out";
        if (d.isWinner) cls = "winner";

        let gap = "-";
        if (d.out) {
            gap = "DNF";
        } else if (i > 0) {
            gap = "+" + (d.total - leaderTime).toFixed(2) + " s";
        }

        html += `<tr class="${cls}">
            <td>${i + 1}</td>
            <td class="driverName">${d.name}</td>
            <td>${d.team}</td>
            <td><span class="tyre ${d.tyre === TYRES.soft ? "soft" : "hard"}">${d.tyre.name}</span></td>
            <td>${d.lapsDone === 0 ? "0:00.00" : formatTime(d.total)}</td>
            <td>${gap}</td>
            <td>${d.statusStart}</td>
            <td>${d.statusEnd}</td>
        </tr>`;
    });

    boardBody.innerHTML = html;
}

function log(text, type) {
    if (eventLog.firstElementChild && eventLog.firstElementChild.classList.contains("info")) {
        eventLog.innerHTML = "";
    }

    const item = document.createElement("li");
    item.className = type;
    item.textContent = `[Круг ${lap}] ${text}`;
    eventLog.prepend(item);

    while (eventLog.children.length > 8) {
        eventLog.lastElementChild.remove();
    }
}

function beginLap() {
    if (raceOver) return;

    lap++;
    btnNext.disabled = true;
    lapCounter.textContent = `Круг ${lap} / ${TOTAL_LAPS}`;

    if (lap === 1) {
        log("Трката започна во Скопје! Светлата се гаснат.", "start");
    }

    const safetyCar = lap >= 3 && Math.random() < 0.15;
    if (safetyCar) {
        log("Безбедносното возило излезе на патека!", "safety");
    }

    grid.forEach(d => {
        if (!d.out) {
            d.statusStart = safetyCar ? "Зад безбедносно возило" : "Во трка";
            d.statusEnd = "...";
        }
    });

    drawBoard();
    setTimeout(() => finishLap(safetyCar), LAP_DELAY_MS);
}

function finishLap(safetyCar) {
    grid.forEach(d => {
        if (d.out) return;

        const notes = [];

        d.total += d.runLap(safetyCar);
        d.tyreAge++;

        const roll = Math.random();
        if (roll < 0.025) {
            d.out = true;
            d.statusEnd = "Излетен (DNF)";
            log(`${d.name} излета од трката!`, "dnf");
            return;
        }
        if (roll < 0.12) {
            d.total += 5;
            notes.push("Се извртел");
            log(`${d.name} се извртува и губи 5 секунди.`, "spin");
        }

        d.lapsDone++;

        if (!d.pitted && lap >= d.pitOnLap) {
            d.changeTyres();
            notes.push("Пит-стоп");
            log(`${d.name} влегува во боксот и става ${d.tyre.name.toLowerCase()} гуми.`, "pit");
        }

        if (notes.length === 0) {
            notes.push(safetyCar ? "Зад безбедносно возило" : "Чист круг");
        }
        d.statusEnd = notes.join(" + ");
    });

    sortGrid();

    const first = grid[0];
    if (!first.out) {
        if (leaderName !== null && leaderName !== first.name) {
            log(`${first.name} е нов лидер!`, "leader");
        }
        leaderName = first.name;
    }

    if (lap === TOTAL_LAPS) {
        declareWinner();
    } else {
        btnNext.disabled = false;
    }

    drawBoard();
}

function declareWinner() {
    raceOver = true;
    btnNext.disabled = true;
    btnNext.textContent = "Трката заврши";

    const winner = grid.find(d => !d.out);
    winnerBox.classList.remove("hidden");

    if (winner) {
        winner.isWinner = true;
        winner.statusEnd = "🏆 Победник";
        winnerBox.textContent = `🏆 Победник: ${winner.name} (${winner.team}) - ${formatTime(winner.total)}`;
        log(`${winner.name} ја победи трката!`, "leader");
    } else {
        winnerBox.textContent = "Сите возачи излегоа - нема победник.";
    }
}

btnNext.addEventListener("click", beginLap);
btnReset.addEventListener("click", () => location.reload());

sortGrid();
drawBoard();