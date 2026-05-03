from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/recommend', methods=['POST'])
def recommend():
    song_name = request.json.get('song_name')
    if not song_name:
        return jsonify({'error': 'Lütfen bir şarkı adı girin.'}), 400

    try:
        # 1. Deezer API'de şarkıyı ara
        search_res = requests.get(f"https://api.deezer.com/search?q={song_name}&limit=1").json()
        if 'data' not in search_res or len(search_res['data']) == 0:
            return jsonify({'error': 'Şarkı bulunamadı. Lütfen başka bir şarkı deneyin.'}), 404
            
        seed_track = search_res['data'][0]
        artist_id = seed_track['artist']['id']
        
        # 2. Şarkıcının benzer sanatçılarını bul
        rel_art = requests.get(f"https://api.deezer.com/artist/{artist_id}/related").json()
        
        formatted_recommendations = []
        if 'data' in rel_art and len(rel_art['data']) > 0:
            # En çok benzeyen 3-4 sanatçının en popüler şarkılarını alıp öneri listesi oluştur
            for a in rel_art['data'][:4]:
                top = requests.get(f"https://api.deezer.com/artist/{a['id']}/top?limit=3").json()
                if 'data' in top:
                    for track in top['data']:
                        formatted_recommendations.append({
                            'id': track['id'],
                            'name': track['title'],
                            'artist': track['artist']['name'],
                            'album_art': track['album']['cover_medium'],
                            'preview_url': track['preview'], 
                            'spotify_url': track['link'] # Deezer linki olarak geçiyor
                        })
        
        if not formatted_recommendations:
            return jsonify({'error': 'Bu şarkıya benzer yeterli veri bulunamadı.'}), 404

        return jsonify({
            'seed_song': {
                'name': seed_track['title'],
                'artist': seed_track['artist']['name'],
                'album_art': seed_track['album']['cover_medium']
            },
            'recommendations': formatted_recommendations[:12] # Ekrana en fazla 12 tane göster
        })

    except Exception as e:
        print(f"Hata: {str(e)}")
        return jsonify({'error': 'Müzik veritabanı ile iletişim kurulurken bir hata oluştu.'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
