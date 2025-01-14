/**
 * Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

var gActiveListeners = {};

// These event (un)registration handlers only work for one window, DONOT use
// them with multiple windows.
function registerPopupEventHandler(eventName, callback, win) {
  if (!win) {
    win = window;
  }
  gActiveListeners[eventName] = function(event) {
    if (event.target != win.PopupNotifications.panel) {
      return;
    }
    win.PopupNotifications.panel.removeEventListener(
      eventName,
      gActiveListeners[eventName]
    );
    delete gActiveListeners[eventName];

    callback.call(win.PopupNotifications.panel);
  };
  win.PopupNotifications.panel.addEventListener(
    eventName,
    gActiveListeners[eventName]
  );
}

function unregisterPopupEventHandler(eventName, win) {
  if (!win) {
    win = window;
  }
  win.PopupNotifications.panel.removeEventListener(
    eventName,
    gActiveListeners[eventName]
  );
  delete gActiveListeners[eventName];
}

function unregisterAllPopupEventHandlers(win) {
  if (!win) {
    win = window;
  }
  for (let eventName in gActiveListeners) {
    win.PopupNotifications.panel.removeEventListener(
      eventName,
      gActiveListeners[eventName]
    );
  }
  gActiveListeners = {};
}

function triggerMainCommand(popup) {
  info("triggering main command");
  let notifications = popup.childNodes;
  ok(notifications.length > 0, "at least one notification displayed");
  let notification = notifications[0];
  info("triggering command: " + notification.getAttribute("buttonlabel"));

  EventUtils.synthesizeMouseAtCenter(notification.button, {});
}

function triggerSecondaryCommand(popup) {
  info("triggering secondary command");
  let notifications = popup.childNodes;
  ok(notifications.length > 0, "at least one notification displayed");
  let notification = notifications[0];
  EventUtils.synthesizeMouseAtCenter(notification.secondaryButton, {});
}

function dismissNotification(popup) {
  info("dismissing notification");
  executeSoon(function() {
    EventUtils.synthesizeKey("KEY_Escape");
  });
}

function waitForMessage(aMessage, browser) {
  // We cannot capture aMessage inside the checkFn, so we override the
  // checkFn.toSource to tunnel aMessage instead.
  let checkFn = function() {};
  checkFn.toSource = function() {
    return `function checkFn(event) {
      let message = ${aMessage.toSource()};
      is(event.data, message, "Received: " + message);
      if (event.data == message) {
        return true;
      }
      throw new Error(
       \`Unexpected result: \$\{event.data\}, expected \$\{message\}\`
      );
    }`;
  };

  return BrowserTestUtils.waitForContentEvent(
    browser.selectedBrowser,
    "message",
    /* capture */ true,
    checkFn,
    /* wantsUntrusted */ true
  );
}

function dispatchEvent(eventName) {
  info("dispatching event: " + eventName);
  let event = document.createEvent("Events");
  event.initEvent(eventName, false, false);
  gBrowser.selectedBrowser.contentWindow.dispatchEvent(event);
}

function setPermission(url, permission) {
  let uri = Services.io.newURI(url);
  let principal = Services.scriptSecurityManager.createContentPrincipal(
    uri,
    {}
  );

  Services.perms.addFromPrincipal(
    principal,
    permission,
    Ci.nsIPermissionManager.ALLOW_ACTION
  );
}

function removePermission(url, permission) {
  let uri = Services.io.newURI(url);
  let principal = Services.scriptSecurityManager.createContentPrincipal(
    uri,
    {}
  );

  Services.perms.removeFromPrincipal(principal, permission);
}

function getPermission(url, permission) {
  let uri = Services.io.newURI(url);
  let principal = Services.scriptSecurityManager.createContentPrincipal(
    uri,
    {}
  );

  return Services.perms.testPermissionFromPrincipal(principal, permission);
}
