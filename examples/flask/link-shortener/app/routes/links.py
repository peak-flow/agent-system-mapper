"""
Link routes - handle URL shortening operations

ARCHITECTURE NOTE:
All routes in single file. In larger app, would split:
- /api/links -> API blueprint
- /r/<code> -> Redirect blueprint
- / -> Web UI blueprint

Wart: No authentication/authorization
Wart: No input validation middleware
Wart: No rate limiting
"""
from flask import Blueprint, request, redirect, jsonify, render_template, abort
from app.services import ShortenerService


bp = Blueprint('links', __name__)


@bp.route('/')
def index():
    """
    Home page with link creation form.

    Wart: Template uses inline styles (no CSS file)
    """
    return render_template('index.html')


@bp.route('/api/links', methods=['POST'])
def create_link():
    """
    Create a shortened link.

    Expects JSON: { "url": "https://example.com", "custom_code": "optional" }

    Wart: No URL validation
    Wart: No rate limiting
    Wart: Returns 500 on collision instead of 409
    """
    data = request.get_json()

    if not data or 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400

    url = data['url']
    custom_code = data.get('custom_code')

    # Wart: Minimal validation - just checks for presence
    # Should validate: scheme, domain, length, blocklist
    if not url.startswith(('http://', 'https://')):
        return jsonify({'error': 'URL must start with http:// or https://'}), 400

    try:
        link = ShortenerService.create_short_link(
            original_url=url,
            custom_code=custom_code,
        )
        return jsonify(link.to_dict()), 201
    except ValueError as e:
        # Wart: Collision returns 500, should be 409
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        # Wart: Generic error handling exposes details
        return jsonify({'error': f'Failed to create link: {str(e)}'}), 500


@bp.route('/r/<short_code>')
def redirect_to_url(short_code):
    """
    Redirect to original URL.

    Wart: Does not check expiration
    Wart: Does not validate short_code format
    Wart: Tracking happens before redirect (slow)
    """
    link = ShortenerService.get_link_by_code(short_code)

    if not link:
        abort(404)

    # Wart: Expiration check exists in service but not called here!
    # if ShortenerService._is_expired(link):
    #     abort(410)  # Gone

    # Record click (blocking - slows redirect)
    # Wart: Should be async/background job
    ShortenerService.record_click(link)

    # Wart: 302 redirect - should be 301 for permanent
    # or configurable per link
    return redirect(link.original_url)


@bp.route('/api/links/<short_code>')
def get_link_stats(short_code):
    """
    Get link statistics.

    Wart: No authentication - anyone can see stats
    """
    stats = ShortenerService.get_stats(short_code)

    if not stats:
        return jsonify({'error': 'Link not found'}), 404

    return jsonify(stats)


@bp.route('/api/links/<short_code>', methods=['DELETE'])
def delete_link(short_code):
    """
    Delete a link.

    Wart: No authentication - anyone can delete any link
    Wart: No confirmation
    """
    deleted = ShortenerService.delete_link(short_code)

    if deleted:
        return '', 204
    else:
        return jsonify({'error': 'Link not found'}), 404


# Wart: No error handlers defined
# @bp.errorhandler(404)
# @bp.errorhandler(500)
