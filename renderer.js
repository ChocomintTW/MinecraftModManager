window.addEventListener('DOMContentLoaded', () => {
	// https://codeseven.github.io/toastr/demo.html
	toastr.options = {
		"closeButton": false,
		"debug": false,
		"newestOnTop": false,
		"progressBar": true,
		"positionClass": "toast-bottom-left",
		"preventDuplicates": false,
		"onclick": null,
		"showDuration": "300",
		"hideDuration": "1000",
		"timeOut": "5000",
		"extendedTimeOut": "1000",
		"showEasing": "swing",
		"hideEasing": "linear",
		"showMethod": "fadeIn",
		"hideMethod": "fadeOut"
	};

	document.addEventListener('add-mod-success', (e) => toastr.success(e.detail.msg));
	document.addEventListener('add-mod-exist', (e) => toastr.warning(e.detail.msg));

	document.addEventListener('mod-not-found', (e) => toastr.error(e.detail.msg));

	document.addEventListener('delete-mod', (e) => toastr.success(e.detail.msg));

	document.addEventListener('add-instance-error', (e) => toastr.warning(e.detail.msg));
	document.addEventListener('add-instance-success', (e) => toastr.success(e.detail.msg));

	document.addEventListener('delete-instance', (e) => toastr.success(e.detail.msg));

	// https://sweetalert2.github.io/
	
	// Swal.fire({
	// 	title: 'Are you sure?',
	// 	text: "You won't be able to revert this!",
	// 	icon: 'warning',
	// 	showCancelButton: true,
	// 	confirmButtonColor: '#3085d6',
	// 	cancelButtonColor: '#d33',
	// 	confirmButtonText: 'Yes'
	// }).then((result) => {
	// 	if (result.isConfirmed) {
	// 		Swal.fire(
	// 			'Deleted!',
	// 			'Your file has been deleted.',
	// 			'success'
	// 		)
	// 	}
	// });
});

window.addEventListener('mousemove', (event) => {
	var tooltip = document.getElementById('mod-open-ext');
	tooltip.style.left = (event.clientX + 10) + 'px';
	tooltip.style.top = (event.clientY + 10) + 'px';

	var tooltip2 = document.getElementById('view-ins-mods');
	tooltip2.style.left = (event.clientX + 10) + 'px';
	tooltip2.style.top = (event.clientY + 10) + 'px';
});