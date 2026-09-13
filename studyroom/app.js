const state = { rawData: null };
let barChart = null;
let pieChart = null;

async function loadData() {
    $('#status').text("加载中...").show();
    try {
        const res = await fetch("data/studyroom.json");
        if (!res.ok) {
            throw new Error("HTTP " + res.status);
        }
        const jsonData = await res.json();
        if (!jsonData || !jsonData.rooms || jsonData.rooms.length === 0) {
            $('#status').text("暂无数据").show();
            return;
        }
        state.rawData = jsonData;
        $('#source-text').text(`数据来源：${jsonData.source}`);
        $('#status').hide();

        renderRoomCards(jsonData.rooms);
        renderBuildingBar(jsonData.rooms);
        renderStatusPie(jsonData.rooms);

    } catch (err) {
        $('#status').text("加载失败：" + err.message).show();
    }
}

function renderRoomCards(roomList) {
    $('#room-cards').empty();
    roomList.forEach(room => {
        const freeSeat = room.seats - room.occupied;
        $('#room-cards').append(`
    <div class="col-md-4 col-lg-3">
      <div class="card room-card">
        <div class="card-body">
          <h5 class="card-title h6">${room.name}</h5>
          <p class="card-text small">楼宇：${room.building} ${room.floor}楼</p>
          <p class="card-text small">总座位：${room.seats}｜已占用：${room.occupied}｜空闲：${freeSeat}</p>
          <p class="card-text small">状态：${room.status}</p>
          <p class="card-text small text-muted">开放时间：${room.hours}</p>
        </div>
      </div>
    </div>
    `);
    });
    $('#room-cards').on('click', '.room-card', function () {
        $(this).toggleClass("border-primary shadow");
    });
}

function renderBuildingBar(rooms) {
    const buildingMap = {};
    rooms.forEach(r => {
        if (!buildingMap[r.building]) buildingMap[r.building] = 0;
        buildingMap[r.building] += r.seats;
    });
    const buildings = Object.keys(buildingMap);
    const seatCounts = buildings.map(b => buildingMap[b]);

    if (!barChart) {
        barChart = echarts.init(document.querySelector("#building-bar"));
    }
    barChart.setOption({
        title: { text: "各楼宇自习室总座位数（单位：个）", left: "center" },
        tooltip: { trigger: "axis" },
        xAxis: { data: buildings },
        yAxis: { name: "座位数", min: 0 },
        series: [
            {
                name: "总座位",
                type: "bar",
                data: seatCounts
            }
        ]
    });
}

function renderStatusPie(rooms) {
    if (pieChart !== null) {
        pieChart.destroy();
    }
    let openCnt = 0, repairCnt = 0, closeCnt = 0;
    rooms.forEach(r => {
        if (r.status === "开放") openCnt++;
        else if (r.status === "维修") repairCnt++;
        else if (r.status === "闭馆") closeCnt++;
    });
    const ctx = document.querySelector("#status-pie");
    pieChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["开放", "维修", "闭馆"],
            datasets: [{
                data: [openCnt, repairCnt, closeCnt]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: "自习室房间状态分布（房间数量）" },
                legend: { position: "bottom" }
            }
        }
    });
}

window.addEventListener('resize', () => {
    if (barChart) barChart.resize();
});

$(function () {
    loadData();
});
