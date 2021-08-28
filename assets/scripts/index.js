// time conversion

const timeAgo = (time) => {
  switch (typeof time) {
    case 'number':
      break;
    case 'string':
      time = +new Date(time);
      break;
    case 'object':
      if (time.constructor === Date) time = time.getTime();
      break;
    default:
      time = +new Date();
  }
  var time_formats = [
    [60, 'seconds', 1], // 60
    [120, '1 minute ago', '1 minute from now'], // 60*2
    [3600, 'minutes', 60], // 60*60, 60
    [7200, '1 hour ago', '1 hour from now'], // 60*60*2
    [86400, 'hours', 3600], // 60*60*24, 60*60
    [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
    [604800, 'days', 86400], // 60*60*24*7, 60*60*24
    [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
    [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
    [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
    [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
    [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
    [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
  ];
  var seconds = (+new Date() - time) / 1000,
    token = 'ago',
    list_choice = 1;

  if (seconds == 0) {
    return 'Just now'
  }
  if (seconds < 0) {
    seconds = Math.abs(seconds);
    token = 'from now';
    list_choice = 2;
  }
  var i = 0,
    format;
  while (format = time_formats[i++])
    if (seconds < format[0]) {
      if (typeof format[2] == 'string')
        return format[list_choice];
      else
        return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
    }
  return time;
};

// Default Colors for language circle
const DEFAULT_COLORS = ['red', 'purple', 'green', 'orange', 'cyan', 'magenta', 'blue'];
const COLORS = {};

// filter constant
const filters = {
    sort: {
        innerLabel: 'Select Order',
        filterKeys: { updated_at: 'Last Updated', stargazers_count: 'Stars' },
    }
};

const mappingFilterKeys = {
    updated_at: 'Last Updated',
    stargazers_count: 'Stars',
};

const activeFilters = {
    language: 'All',
    sort: 'updated_at',
};

// inserting a node as next sibling to a node
const insertAfter = (newNode, referenceNode) => {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

// create error node
const createErrorNode = (element, message) => {
    const errorElement = document.createElement("div");
    errorElement.id = "error";
    errorElement.innerHTML = message;
    insertAfter(errorElement, element);
};

// fetch API data with default retry count 3
const fetchData = (URL, options={}, retryCount = 3) => (
    fetch(URL, options).catch((error) => {
        if (retryCount === 1) {
            throw error;
        }
        return fetchData(URL, options, retryCount - 1);
    })
);

// calling API to get user repositories
const fetchGithubReposAPI = async (username) => {
    console.log('Api called!', username);
    try {
        const response = await fetchData(`https://api.github.com/users/${username}/repos`);
        if (response.status >= 200 && response.status < 300) {
            return response.json();
        } else {
            return { message: 'User is invalid, please try with correct username' };
        }
    } catch(e) {
        window.alert('Unable to fetch data!');
    }
};

// if language coming into response, then filter is being made here
const contructLanguageFilter = (data) => {
    const languageFilter = {
        innerLabel: 'Select Language',
        filterKeys: [],
    };
    let languageObj = data.reduce((acc, item) => {
        if (item.language) {
            acc[item.language] = item.language;
        }
        return acc;
    }, {});

    console.log(languageObj, 'languageObj');

    if (Object.keys(languageObj).length > 0) {
        languageObj = Object.assign({ All: "All" }, languageObj);
        languageFilter.filterKeys = languageObj;
        filters.language = languageFilter;
        Object.keys(languageObj).forEach((language, i) => {
            COLORS[language] = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        });
    }
};

const createFilterList = (searchFilters, type, target, data) => {
    const filter = searchFilters[type];
    const popUpCover = document.createElement("div");
    popUpCover.className = 'popup-cover';
    const popupList = document.createElement("div");
    popupList.className = 'popupList';
    const cross = document.createElement("div");
    cross.className = 'cross';
    cross.innerHTML = 'x';
    const overlay = document.getElementById('overlay');
    cross.onclick = () => {
        popUpCover.remove();
        overlay.style.display = 'none';
    };
    const label = document.createElement("div");
    label.className = 'label';
    label.innerText = filter.innerLabel;
    popupList.appendChild(cross);
    popupList.appendChild(label);
    const ul = document.createElement("ul");
    Object.keys(filter.filterKeys).forEach((key, i) => {
        const li = document.createElement('li');
        li['data-value'] = key;
        li.innerHTML = filter.filterKeys[key];
        if (activeFilters[type] === key) {
            li.className = 'active';
            activeFilters[type] = key;
        }
        li.onclick = () => {
            const activeLi = document.querySelector('.popupList ul li.active');
            if (activeLi) {
                activeLi.classList.remove('active');
            }
            li.className = "active";
            activeFilters[type] = key;
            const btn = document.getElementById(`${type}-btn`);
            if (btn) {
                btn.innerHTML = `${type[0].toUpperCase()}${type.slice(1)}: ${mappingFilterKeys[activeFilters[type]] || activeFilters[type]}`;
            }
            setTimeout(() => {
                popUpCover.remove();
                overlay.style.display = 'none';
            }, 100);
            renderReposList(data);
        };
        ul.appendChild(li);
    });
    popupList.appendChild(ul);
    popUpCover.appendChild(popupList);
    target.appendChild(popUpCover);
};

// filter rendering
const renderFilters = (data) => {
    const searchForm = document.getElementById('search-form');
    const element = document.createElement("div");
    element.id = "filters";
    console.log('filters', filters);
    Object.keys(filters).forEach((item) => {
        const el = document.createElement('div');
        el.className = 'filter-btn-cover';
        const button = document.createElement('button');
        button.id = `${item}-btn`;
        button.innerHTML = `${item[0].toUpperCase()}${item.slice(1)}: ${mappingFilterKeys[activeFilters[item]] || activeFilters[item]}`;
        button.onclick = () => {
            createFilterList(filters, item, el, data);
            const overlay = document.getElementById('overlay');
            if (overlay) {
                overlay.style.display = 'block';
            }
        };
        el.appendChild(button);
        const overlay = document.createElement("div");
        overlay.id = 'overlay';
        el.appendChild(overlay);
        element.appendChild(el);
    });
    console.log(searchForm, element);
    insertAfter(element, searchForm);
};

// data sorting
const sortUIData = (data) => {
    let newData = [...data];
    Object.keys(activeFilters).forEach((item) => {
        if (item === 'language' && activeFilters[item] !== 'All') {
            newData = newData.filter((temp) => temp.language === activeFilters[item]);
        }
        if (item === 'sort' && activeFilters[item] === 'updated_at') {
            newData = newData.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }
        if (item === 'sort' && activeFilters[item] === 'stargazers_count') {
            newData = newData.sort((a, b) => b.stargazers_count - a.stargazers_count);
        }
    });
    return newData;
};

// repos list rendering here
const renderReposList = (data) => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = null;
    const newData = sortUIData(data);
    newData.forEach((item) => {
        const listItem = document.createElement('div');
        listItem.className = 'repo';
        const nameAnchor = document.createElement('a');
        nameAnchor.href = item.html_url;
        nameAnchor.target = '_blank';
        nameAnchor.innerText = item.name;
        listItem.appendChild(nameAnchor);
        if (item.description) {
            const description = document.createElement('p');
            description.innerText = item.description;
            listItem.appendChild(description);
        }
        const footer = document.createElement('div');
        if (item.language) {
            const lang = document.createElement('p');
            lang.className = "language";
            const circle = document.createElement('div');
            circle.className = 'circle';
            circle.style.backgroundColor = COLORS[item.language];
            const langTextNode = document.createTextNode(item.language);
            lang.appendChild(circle);
            lang.appendChild(langTextNode);
            footer.appendChild(lang);
        }
        const stars = document.createElement('p');
        stars.className = "stars";
        const startTextNode = document.createTextNode(item.stargazers_count);
        const starImg = document.createElement('img');
        starImg.src = './assets/images/stars.jpg';
        stars.appendChild(starImg);
        stars.appendChild(startTextNode);
        footer.appendChild(stars);
        const updatedAt = document.createElement('p');
        updatedAt.className = "updatedat";
        updatedAt.innerText = timeAgo(new Date(item.updated_at));
        footer.appendChild(updatedAt);
        listItem.appendChild(footer);
        mainContent.appendChild(listItem);
    });
};

// API call trigger from here
const onSearchFormSubmit = async (e) => {
    e.preventDefault();
    const userElement = document.getElementById('username');
    const username = userElement.value;
    const formGroup = document.querySelector('#search-form > .group');
    const filters = document.getElementById('filters');
    if (filters) {
        filters.remove();
    }
    const error = document.getElementById('error');
    if (error) {
        error.remove();
    }
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = null;

    // validate username for empty
    if (!username) {
        const message = "User name is mandatory!";
        createErrorNode(formGroup, message);
        return;
    }
    const errorElement = document.getElementById('error');
    if (errorElement) {
        errorElement.remove();
    }

    // getting repos data
    const data = await fetchGithubReposAPI(username);
    if (data.message) {
        createErrorNode(formGroup, data.message);
        return;
    }
    if (data && data.length === 0) {
        createErrorNode(formGroup, `No repos available for the user ${username}`);
        return;
    }

    contructLanguageFilter(data);
    renderFilters(data);
    renderReposList(data);
};

window.onload = () => {
    var searchForm = document.getElementById("search-form");
    searchForm.addEventListener('submit', onSearchFormSubmit);
};

window.onunload = () => {
    searchForm.removeEventListener('submit', onSearchFormSubmit);
};

