const API_KEY = "";

$(document).ready(function(){ 

	$('select').formSelect();
	$('#informacoes').hide();
	$('#universidades').hide();

	$('#button').click(function(){
		pesquisa();
	});

	$( "#prefix" ).keypress(function(e) {
		if (e.which == 13) {
			pesquisa();
		}
	});

	if(navigator.geolocation) {
	    navigator.geolocation.getCurrentPosition(function(position){
	    	mapa(position.coords.latitude, position.coords.longitude);
	    }, 
	    function(error){ 
	    	console.log('Erro ao obter localização.', error);
	    });
	} else {
		console.log('Navegador não suporta Geolocalização!');
	}
});

function setFaculdade(resp){
	$("#faculdades").append("<br><strong>Nome: </strong>",resp.name);
	$("#faculdades").append("<br><strong>Site: </strong>",resp.web_pages);
	$("#faculdades").append("<br><strong>País: </strong>",resp.country);
	$("#faculdades").append("<br><hr>");
} 

function pesquisa() {
	let prefix=$('#prefix').val();
	$('#prefix').val('');
	
	pais = $("#paises option:selected").val();

	let urlBase = "";

	if(prefix != '')
		urlBase = "http://universities.hipolabs.com/search?name="+prefix+"&country="+pais;
	else
		urlBase = "http://universities.hipolabs.com/search?country="+pais;			

	$.ajax({	
		url : urlBase,
		crossDomain: true,
		dataType: 'json',
		success: function(resp) {

			try {
				nome =  resp[0].name;
				for(r in resp){
					if(r==0){
						$('#universidades').hide();
						$("#faculdades").html("");
						$("#msg_erro").html("");
						getCoord(nome); 
						$('#informacoes').show();
					}
					else{
						if(r==1){
							$("#faculdades").append("<br><strong>Outras faculdades:</strong>");
							$('#universidades').show();
						}
						setFaculdade(resp[r]);
					}
				}
			}
			catch (e) {
				$("#msg_erro").html();
				$("#msg_erro").html("<br>* Nenhuma faculdade encontrada com essa descrição");
			}
		},
		type: 'GET'
	});
}

function getDescricaoLocal(id){
	const proxyurl = "https://cors-anywhere.herokuapp.com/";
	$.ajax({
		url: proxyurl + "https://maps.googleapis.com/maps/api/place/details/json?place_id="+id+"&key="+API_KEY,
		crossDomain: true,
		dataType: 'json',
		success: function(resp) {
			let endereco = resp.result.adr_address;
			let telefone = resp.result.formatted_phone_number;
			let fotoReferencia = resp.result.photos[0].photo_reference;
			let texto = "Endereço: "+ endereco + "<br>Telefone: "+telefone;
			let local = resp.result.name;
			let link =  resp.result.website;
			getInformacoes(fotoReferencia, texto, local, link);
			setReviews(resp);
			getVagas(endereco);	
		},
		type: 'POST'
	});
}

function getInformacoes(fotoReferencia, texto, local, link){
	$("#informacoes").html("");
	$("#informacoes").html('<div class="row">'
		+'<div class="col s12 m12 l12">'
		+'	<div class="card">'
		+'		<div class="card-image">'
		+'			<img src="https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference='+fotoReferencia+'&key='+API_KEY+'">	'
		+'			<span class="card-title">'+local+'</span>'
		+'			<a href="'+link+'" class="btn-floating halfway-fab waves-effect waves-light red"><i class="material-icons">add</i></a>'
		+'		</div>'
		+'		<div class="card-content">'
		+'			<p>'+texto+'</p>'
		+'		</div>'
		+'		<div class="card" id="reviews">'		
		+'		</div>'
		+'		<div class="card" id="vagas">'		
		+'		</div>'
		+'	</div>'
		+'</div>'
		+'</div>'

		);
}

function setReviews(resp){
	$("#reviews").html("");
	$("#reviews").append("<strong>Reviews</strong><br>");
	for(r in resp.result.reviews){
		if(r == 3)
			break;
		$("#reviews").append("<strong>Autor: </strong>"+resp.result.reviews[r].author_name);
		$("#reviews").append("<br><strong>Nota: </strong>"+resp.result.reviews[r].rating);
		$("#reviews").append("<br><strong>Texto: </strong>"+resp.result.reviews[r].text);
		$("#reviews").append("<br><strong>Data: </strong>"+resp.result.reviews[r].relative_time_description);
		$("#reviews").append("<hr>");
	}

}

function getVagas(endereco){
	const proxyurl = "https://cors-anywhere.herokuapp.com/";
	$.ajax({
		url: proxyurl+"https://jobs.github.com/positions.json?location="+endereco,
		crossDomain: true,
		dataType: 'json',
		success: function(resp) {
			setVagas(resp);	
		},
		type: 'GET'
	});
}

function setVagas(resp){
	$("#vagas").html();
	
	for(r in resp){
		if(r==0)
			$("#vagas").append("<strong>Vagas de emprego proximas ao local</strong><br>");
		if(r == 3)
			break;
		$("#vagas").append("<br><strong>"+resp[r].title+"</strong>");
		$("#vagas").append("<br><strong>Companhia: </strong>"+resp[r].company);
		$("#vagas").append("<br><strong>Descrição: </strong>"+resp[r].description);
		$("#vagas").append("<br><strong>Localização: </strong>"+resp[r].location);
		$("#vagas").append("<br><strong>Tipo: </strong>"+resp[r].type);
		$("#vagas").append('<br><div class="card-action">' 
			+'<a href="'+resp[r].url+'">Mais informações</a>'
			+'</div>');
		$("#vagas").append("<hr>");
	}	
}


function getCoord(nome){
	$.ajax({

		url: "https://maps.googleapis.com/maps/api/geocode/json?address="+nome+"&key="+API_KEY,
		crossDomain: true,
		dataType: 'json',
		success: function(resp) {

			var latitude= JSON.parse(resp.results[0].geometry.location.lat);
			var longitude= JSON.parse(resp.results[0].geometry.location.lng);
			var id= resp.results[0].place_id;	

			getDescricaoLocal(id);
			$('#mapa').html(mapa(latitude,longitude));
		},
		type: 'GET'
	});
}

function mapa(latitude, longitude) {

	var coord = {lat: latitude, lng: longitude};
	
	var map = new google.maps.Map(document.getElementById('mapa'), {
		zoom: 18,
		center: coord
	});

	var marker = new google.maps.Marker({
		position: coord,
		map: map
	});
}
