// TODOは最大3件まで
const MAX_TODOS = 3;

// 画面の部品を取得
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const count = document.getElementById("count");
const progress = document.getElementById("progress");
const completeMessage = document.getElementById("complete-message");
const message =document.getElementById("message");
const list = document.getElementById("todo-list");

// TODOのデータ（例: [{ text: "買い物", done: false }]）
// ブラウザに保存しておき、再読み込みしても消えないようにする
// 保存データが壊れていても、アプリが止まらないようにする
// 今日の日付を「2026-10-7」の形式の文字列で返す（保存と比較に使う）
function todayKey() {
  const now = new Date();
  return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
}

function load() {
  try {
    // 保存した日付が今日と違うなら、新しい1日として空で始める
    if (localStorage.getItem("todosDate") !== todayKey()) {
      return [];
    }
    const saved = JSON.parse(localStorage.getItem("todos"));
    return Array.isArray(saved) ? saved.slice(0, MAX_TODOS) : [];
  } catch (e) {
    return [];
  }
}
let todos = load();

// データを保存する
function save() {
  localStorage.setItem("todos", JSON.stringify(todos));
  localStorage.setItem("todosDate", todayKey()); // 保存した日付も記録
}

// 3件完了した日を履歴に保存する（例: {"2026-10-8": 3}）
// 日付をキーにしているので、同じ日は上書きされるだけで重複しない
function saveHistory() {
  let history = {};
  try {
    const saved = JSON.parse(localStorage.getItem("history"));
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      history = saved;
    }
  } catch (e) {
    history = {};
  }
  history[todayKey()] = MAX_TODOS;
  localStorage.setItem("history", JSON.stringify(history));
}

// 履歴を読み込んで「2026年10月8日：3件完了」の形で一覧表示する（新しい日付が上）
function renderHistory() {
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";

  let history = {};
  try {
    const saved = JSON.parse(localStorage.getItem("history"));
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      history = saved;
    }
  } catch (e) {
    history = {};
  }

  // "2026-10-8" を [2026, 10, 8] に直して、新しい順に並べる
  const dates = Object.keys(history)
    .map(function (key) {
      return { key: key, parts: key.split("-").map(Number) };
    })
    .filter(function (d) {
      return d.parts.length === 3 && d.parts.every(Number.isFinite);
    })
    .sort(function (a, b) {
      return b.parts[0] - a.parts[0] || b.parts[1] - a.parts[1] || b.parts[2] - a.parts[2];
    });

  if (dates.length === 0) {
    const li = document.createElement("li");
    li.textContent = "まだ履歴はありません";
    historyList.appendChild(li);
    return;
  }

  dates.forEach(function (d) {
    const li = document.createElement("li");
    li.textContent = d.parts[0] + "年" + d.parts[1] + "月" + d.parts[2] + "日：" + history[d.key] + "件完了";
    historyList.appendChild(li);
  });
}

// 画面を作り直す
function render() {
  list.innerHTML = "";

  // 件数を表示（例: 2 / 3）
  count.textContent = todos.length + " / " + MAX_TODOS;

  // 完了チェックが付いているTODOの件数を数えて表示
  const doneCount = todos.filter(function (todo) {
    return todo.done;
  }).length;
  progress.textContent = "今日の達成状況：" + doneCount + " / " + MAX_TODOS + "件完了";

  // 3件すべてが完了しているときだけお祝いメッセージを表示
  completeMessage.hidden = !(todos.length === MAX_TODOS && doneCount === MAX_TODOS);

  todos.forEach(function (todo, index) {
    const li = document.createElement("li");
    if (todo.done) {
      li.classList.add("done"); // 取り消し線用のクラス
    }

    // 完了チェック
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "todo-" + index;
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", function () {
      todo.done = checkbox.checked;
      save();
      // 3件すべて完了したら、今日の履歴を保存
      if (todos.length === MAX_TODOS && todos.every(function (t) { return t.done; })) {
        saveHistory();
        renderHistory(); // 履歴表示にもすぐ反映
      }
      render();
    });

    // TODOの文字（textContentを使うので安全）
    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = todo.text;

    // 削除ボタン
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "削除";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", function () {
      todos.splice(index, 1);
      message.textContent = "";
      save();
      render();
    });

    li.append(checkbox, label, deleteButton);
    list.appendChild(li);
  });
}

// 追加ボタンが押されたとき
form.addEventListener("submit", function (event) {
  event.preventDefault(); // ページの再読み込みを防ぐ

  const text = input.value.trim();
  if (text === "") {
    return;
  }

  if (todos.length >= MAX_TODOS) {
    message.textContent = "TODOは" + MAX_TODOS + "件までです。";
    return;
  }

  todos.push({ text: text, done: false });
  input.value = "";
  message.textContent = "";
  save();
  render();
});

// 今日の日付を「2026年10月5日（月）」の形式で表示
function showToday() {
  const now = new Date();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  document.getElementById("today").textContent =
    now.getFullYear() + "年" + (now.getMonth() + 1) + "月" + now.getDate() + "日（" + weekdays[now.getDay()] + "）";
}

// 最初の表示
showToday();
render();
renderHistory();
