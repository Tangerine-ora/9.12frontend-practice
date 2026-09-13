const state = { rawData: null };
let barChart = null;

async function loadData() {
    $('#status').text("加载中...").show();
    try {
        const res = await fetch("data/studyroom.json");
        if (!res.ok) {
            throw new Error("HTTP " + res.status);
        }
        const jsonData = await res.json();
        if (!jsonData.rooms || jsonData.rooms.length === 0) {
            $('#status').text("暂无数据").show();
            return;
        }
        state.rawData = jsonData;
        $('#source-text').text(`数据来源：${jsonData.source}`);
        $('#status').hide();

        renderRoomCards(jsonData.rooms);
        renderBuildingBar(jsonData.rooms);

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
        title: { text: "各楼宇自习室总座位数", left: "center" },
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

$(function () {
    loadData();
});
