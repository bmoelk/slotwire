/**
 * SlotWire WordPress Admin Script
 */
(function ($) {
  'use strict';

  $(document).ready(function () {
    // 1. Generate Random Secret
    $('#sw-btn-generate-secret').on('click', function (e) {
      e.preventDefault();
      var $btn = $(this);
      $btn.prop('disabled', true).text('Generating...');

      $.post(
        slotwireAdmin.ajaxUrl,
        {
          action: 'slotwire_generate_secret',
          nonce: slotwireAdmin.nonce,
        },
        function (res) {
          $btn.prop('disabled', false).html('🎲 Generate');
          if (res.success && res.data && res.data.secret) {
            $('#slotwire_preview_secret').val(res.data.secret);
            alert('New secret generated! Remember to click "Save Settings" below.');
          } else {
            alert('Failed to generate secret.');
          }
        }
      ).fail(function () {
        $btn.prop('disabled', false).html('🎲 Generate');
        alert('Network error while generating secret.');
      });
    });

    // 2. Copy Secret to Clipboard
    $('#sw-btn-copy-secret').on('click', function (e) {
      e.preventDefault();
      var val = $('#slotwire_preview_secret').val();
      if (!val) {
        alert('Secret is empty.');
        return;
      }
      navigator.clipboard.writeText(val).then(function () {
        var $btn = $('#sw-btn-copy-secret');
        var orig = $btn.text();
        $btn.text('✓ Copied!');
        setTimeout(function () {
          $btn.text(orig);
        }, 2000);
      });
    });

    // 3. Copy Astro Config Snippet
    $('#sw-btn-copy-config').on('click', function (e) {
      e.preventDefault();
      var code = $('#sw-astro-config-code').text();
      navigator.clipboard.writeText(code).then(function () {
        var $btn = $('#sw-btn-copy-config');
        var orig = $btn.text();
        $btn.text('✓ Copied!');
        setTimeout(function () {
          $btn.text(orig);
        }, 2000);
      });
    });

    // 4. Test Webhook Ping
    $('#sw-btn-test-webhook').on('click', function (e) {
      e.preventDefault();
      var $btn = $(this);
      var $result = $('#sw-webhook-test-result');

      $btn.prop('disabled', true).text('📡 Testing...');
      $result.removeClass('success error').text('Dispatching test ping to Astro...');

      $.post(
        slotwireAdmin.ajaxUrl,
        {
          action: 'slotwire_test_webhook',
          nonce: slotwireAdmin.nonce,
        },
        function (res) {
          $btn.prop('disabled', false).html('📡 Test Webhook Ping');
          if (res.success) {
            $result.addClass('success').text('✓ Connected! HTTP ' + res.data.code + ' OK');
          } else {
            var msg = (res.data && res.data.error) || 'Failed to connect';
            if (res.data && res.data.code) {
              msg = 'HTTP ' + res.data.code + ': ' + msg;
            }
            $result.addClass('error').text('✕ ' + msg);
          }
        }
      ).fail(function () {
        $btn.prop('disabled', false).html('📡 Test Webhook Ping');
        $result.addClass('error').text('✕ Network request failed.');
      });
    });
  });
})(jQuery);
