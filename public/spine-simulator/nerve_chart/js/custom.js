$(document).ready(function () {    

	$(".help-guide").on("click", function(){
	  $(".guide-popup,.help-guide").addClass("active");
	  $("body").addClass("active");
	});
	$(".close, .guide-popup").on("click", function(){
  		$(".guide-popup,.help-guide").removeClass("active");
  		$("body").removeClass("active");
	});

  /*---------------------help guide popup-----------------*/

  $(".tab_content").hide();
  $(".tab_content:first").show();


  $("ul.tabs li").click(function() {
	
    $(".tab_content").hide();
    var activeTab = $(this).attr("rel"); 
    $("#"+activeTab).fadeIn();		
	
    $("ul.tabs li").removeClass("active");
    $(this).addClass("active");

  $(".tab_drawer_heading").removeClass("d_active");
  $(".tab_drawer_heading[rel^='"+activeTab+"']").addClass("d_active");
  
  });
  $(".tab_container").css("min-height", function(){ 
    return $(".tabs").outerHeight() + 50;
  });

	/* if in drawer mode */
	$(".tab_drawer_heading").click(function() {
      
    $(".tab_content").hide();
    var d_activeTab = $(this).attr("rel"); 
    $("#"+d_activeTab).fadeIn();
	  
	  $(".tab_drawer_heading").removeClass("d_active");
      $(this).addClass("d_active");
	  
	  $("ul.tabs li").removeClass("active");
	  $("ul.tabs li[rel^='"+d_activeTab+"']").addClass("active");
  });
	
  /*---------------------tab design-----------------*/

  var count  = 1;
  var count_ne = 6;
  $('.btn-prev').on('click', function(){       
      $('#im_' + currentImage).stop().fadeOut(0);
      decreaseImage();
      $('#im_' + currentImage).stop().fadeIn(0);
      // $(".btn-next").addClass("active");
      $(".btn-next").removeClass('narola');

      if(count_ne > 1)
        count_ne--;
      // console.log('prev=='+count_ne);
      // var sam = $(this).next();
      //   if($(sam).hasClass('narola')) {
      //          $(sam).removeClass('narola');
      //   }
      if(count_ne == 1) {
        //count_ne = 6;
        $(this).addClass("narola_new");
      } 
  }); 

  $('.btn-next').on('click', function(){  
    $('#im_' + currentImage).stop().fadeOut(0);
    increaseImage();
      $('#im_' + currentImage).stop().fadeIn(0);
      $(".btn-prev").removeClass('narola_new');
      if(count_ne < 6)
        count_ne++;
      // console.log('next=='+count_ne);
      // var sam = $(this).prev();
      //   if($(sam).hasClass('narola_new')) {
      //          $(sam).removeClass('narola_new');
      //   }
      if(count_ne == 6)  {
        //count = 1;
        $(this).addClass("narola");
      }
  }); 

  var currentImage = 1;
  var totalImages = 6;

  function increaseImage() {
    --currentImage;
    if(currentImage < 1) {
      currentImage = 1;
    } 
  }
  function decreaseImage() {  
    ++currentImage;     
    if(currentImage > totalImages) {
      currentImage = totalImages;
    }
  }


  /*---------------------Prev-Next Button-----------------*/

    $('.txt_c').on('click', function(){
     //$(".inner-link li").addClass("active");
    count_ne = 5;
    currentImage = 1;
    $('.btn-next').click();
    // console.log(count_ne);
    $('.txt_c').parent('li').removeClass("active");
    $(this).parent('li').toggleClass('active');
    var click_id= $(this).attr('id');
    var lbl= $(this).attr('txt');
    var cus_html= '<div id="showContainer" class="default_image"><div class="imageContainer" id="im_1"><img src="images/'+click_id+'/1.png" /></div><div class="imageContainer" id="im_2"><img src="images/'+click_id+'/2.png" /></div><div class="imageContainer" id="im_3"><img src="images/'+click_id+'/3.png" /></div><div class="imageContainer" id="im_4"><img src="images/'+click_id+'/4.png" /></div><div class="imageContainer" id="im_5"><img src="images/'+click_id+'/5.png" /></div><div class="imageContainer" id="im_6"><img src="images/'+click_id+'/6.png" /></div></div>';
    var center_im= '<div class="default_image"><img style="-webkit-user-select: none;" src="images/'+click_id+'.png"><div class="txt"><h5>'+click_id+'</h5><h6>'+lbl+'</h6></div></div>';
    var right_im= '<img style="-webkit-user-select: none;" src="images/'+click_id+'-nerves.gif">';
    var spine_img= '<img style="-webkit-user-select: none;" src="images/'+click_id+'-spine.png">';
    $( ".default_image" ).each(function( index ) {
      $(this).addClass('default_none');
      $('.default_none').css('display','none');
      $('.default_none').remove();
    });
    $( ".default_image" ).each(function( index ) {
      $(this).addClass('default_none');
      $('.default_none').css('display','none');
      $('.default_none').remove();
    });
    $('.right_im img').remove();
     $('.spine_img img').remove();
    $('.center_image img').remove();
    $('.center_image').append(center_im);
     $('.spine_img').append(spine_img);
    $('.right_im').append(right_im);
    $(".replace_slider").append(cus_html);
    $('.organ-tags').css('display','none');
    $('.organ-tags').removeClass('display_organs');
    $('#'+click_id+'_id').addClass('display_organs');
  });

  /*---------------------Organs-----------------*/
  
  $(".main-ul .tab_c").click(function() {
    $(".tab_c").removeClass("active");
    $(this).toggleClass("active");
  });
  $('.main-ul .tab_c1').on('click',function(){
    $('.uppar_col .inner-column #tab_d1').toggleClass('active');
    $('.lower_col .inner-column #tab_d1').toggleClass('active');    
  });

  $('.main-ul .tab_c2').on('click',function(){
    $('.uppar_col .inner-column #tab_d2').toggleClass('active');
    $('.lower_col .inner-column #tab_d2').toggleClass('active');    
  });

  $('.main-ul .tab_c3').on('click',function(){
    $('.uppar_col .inner-column #tab_d3').toggleClass('active');
    $('.lower_col .inner-column #tab_d3').toggleClass('active');    
  });

  $('.main-ul .tab_c4').on('click',function(){
    $('.uppar_col .inner-column #tab_d4').toggleClass('active');
    $('.lower_col .inner-column #tab_d4').toggleClass('active');    
  });

  /*---------------------posture page-----------------*/
  
  var modalBtns = [...document.querySelectorAll(".tag-box")];
  modalBtns.forEach(function(btn){
    btn.onclick = function() {
      var modal = btn.getAttribute('data-modal');
      document.getElementById(modal).style.display = "block";
    }
  });

  var closeBtns = [...document.querySelectorAll(".close")];
  closeBtns.forEach(function(btn){
    btn.onclick = function() {
      var modal = btn.closest('.modal');
      modal.style.display = "none";
    }
  });

  /*---------------------Organs popup-----------------*/
     
});

