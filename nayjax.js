//
// AJAX.js - simple promise-based ajax helpers
//


// request() - private, -> promise
// ---------------------------------
// errors (stringly typed):
//  - network error  - unreachable / interrupted
//  - request error  - 400 codes
//  - server error   - 500 codes
//  - aborted        - .abort() called

function request(url, method, data_url_encoded, cb_progress) {
  const xhr = new XMLHttpRequest;

  const promise = new Promise((succeed, fail) => {
    xhr.addEventListener('error', function() { fail('network error'); });
    xhr.addEventListener('abort', function() { fail('aborted'); });

    if (typeof cb_progress === 'function') {
      xhr.addEventListener('progress', cb_progress);
    }

    xhr.addEventListener('readystatechange', function() {
      if (xhr.readyState !== 4) {
        return;
      }

      if (xhr.status >= 400 && xhr.status < 500) {
        fail('request error');
      }
      else if (xhr.status >= 500) {
        fail('server error');
      }
      else if (xhr.status === 0) {
        fail('network error');
      }
      else {
        succeed(xhr.responseText);
      }
    });
  });

  xhr.open(method, url, true);

  if (typeof data_url_encoded === 'string') {
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(data_url_encoded);
  }
  else {
    xhr.send();
  }

  return promise;
}



// get() -> promise, errors same as request()
// ---------------------------------

function get(url, cb_progress) {
  return request(url, 'get', null, cb_progress);
}



// get_json() -> promise, errors: as request + 'invalid json'
// ---------------------------------

function get_json(url, cb_progress) {
  return get(url, cb_progress).then(function(response_text) {
    try {
      return JSON.parse(response_text);
    }
    catch (err) {
      throw 'invalid json';
    }
  });
}



// post() -> promise, errors: as request + 'invalid post data'
// ---------------------------------
// errors - in addition to reqest():
//  - invalid post data

function post(url, data, cb_progress) {
  let data_url_encoded;

  if (typeof data === 'string') {
    data_url_encoded = data;
  }

  else if (data.constructor === Object) {  // Convert to x-www-form-urlencoded string
    data_url_encoded = Object.keys(data).map(k => get_data_component(k, data[k]))
      .join('&');
  }

  else {
    return Promise.reject('invalid post data');
  }

  return request(url, 'post', data_url_encoded, cb_progress);
}



// get_data_component() - x-www-form-urlencoded encoding helper
// ---------------------------------

function get_data_component(key, value) {
  if (value === true) {
    value = 'yes';
  }
  else if (value === false) {
    value = 'no';
  }
  else if (value === null || value === undefined) {
    value = '';
  }
  else if (value.constructor === Array && value.length === 0) {
    value = '';
  }
  else if (value.constructor === Array) {
    key += '[]';
    return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
      .join('&');
  }

  return encodeURIComponent(key) + '=' + encodeURIComponent(value);
}



// interface
// ---------------------------------

export {
  get,
  get_json,
  post,
};

