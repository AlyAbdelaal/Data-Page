document.addEventListener('DOMContentLoaded', () => {
    const machineBrandSelect = document.getElementById('machineBrandSelect'); // تم التعديل
    const machineModelSelect = document.getElementById('machineModelSelect'); // جديد
    const filterDescriptionSelect = document.getElementById('filterDescriptionSelect'); // تم التعديل
    const searchByDropdownsBtn = document.getElementById('searchByDropdownsBtn');
    const partNoSearchInput = document.getElementById('partNoSearchInput');
    const suggestionsBox = document.getElementById('suggestions');
    const searchResultsDiv = document.getElementById('searchResults');
    const resultsCountP = document.getElementById('resultsCount');
    const showAddFilterFormBtn = document.getElementById('showAddFilterFormBtn');
    const addFilterForm = document.getElementById('addFilterForm');
    const addFilterBtn = document.getElementById('addFilterBtn');
    const downloadDataBtn = document.getElementById('downloadDataBtn');

    let allFilters = []; // ستحتوي على جميع بيانات الفلاتر من ملف JSON

    // تعريف متغيرات لتخزين بيانات البحث المسبق لتجنب إعادة الحساب
    let machineBrands = new Set();
    let machineModels = new Set();
    let filterDescriptions = new Set();
    let partNumbers = new Set(); // لاستخدام البحث الفوري

    // 1. تحميل البيانات من ملف JSON
    async function loadFilterData() {
        try {
            const response = await fetch('filters.json'); // تأكد من أن هذا هو اسم ملفك الجديد
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allFilters = data; // تخزين البيانات في المتغير العام

            // تهيئة القوائم المنسدلة وبيانات البحث
            populateMachineBrands();
            collectPartNumbersForSearch(); // جمع أرقام الفلاتر للبحث الفوري
            console.log('بيانات الفلاتر تم تحميلها بنجاح.');
        } catch (error) {
            console.error('خطأ في تحميل بيانات الفلاتر:', error);
            searchResultsDiv.innerHTML = '<p class="no-results">حدث خطأ أثناء تحميل البيانات. يرجى التأكد من وجود ملف "filters.json" وتشغيل خادم محلي.</p>';
        }
    }

    // 2. تعبئة القوائم المنسدلة
    function populateMachineBrands() {
        machineBrandSelect.innerHTML = '<option value="">-- اختر الماركة --</option>';
        machineBrands.clear();

        allFilters.forEach(filter => {
            if (filter['الماركة الرئيسية للمعدة']) {
                machineBrands.add(filter['الماركة الرئيسية للمعدة']);
            }
        });

        Array.from(machineBrands).sort().forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            machineBrandSelect.appendChild(option);
        });
    }

    function populateMachineModels(selectedBrand) {
        machineModelSelect.innerHTML = '<option value="">-- اختر الموديل --</option>';
        filterDescriptionSelect.innerHTML = '<option value="">-- اختر وصف الفلتر --</option>'; // إعادة تعيين
        machineModels.clear();
        filterDescriptionSelect.disabled = true; // تعطيل وصف الفلتر حتى يتم اختيار الموديل

        if (selectedBrand) {
            const filteredByBrand = allFilters.filter(filter =>
                filter['الماركة الرئيسية للمعدة'] === selectedBrand
            );
            filteredByBrand.forEach(filter => {
                if (filter['موديل المعدة']) {
                    machineModels.add(filter['موديل المعدة']);
                }
            });
        }

        Array.from(machineModels).sort().forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            machineModelSelect.appendChild(option);
        });

        machineModelSelect.disabled = !selectedBrand;
    }

    function populateFilterDescriptions(selectedBrand, selectedModel) {
        filterDescriptionSelect.innerHTML = '<option value="">-- اختر وصف الفلتر --</option>';
        filterDescriptions.clear();

        if (selectedBrand && selectedModel) {
            const filteredByBrandAndModel = allFilters.filter(filter =>
                filter['الماركة الرئيسية للمعدة'] === selectedBrand &&
                filter['موديل المعدة'] === selectedModel
            );
            filteredByBrandAndModel.forEach(filter => {
                if (filter['اسم الصنف (إنجليزي)']) {
                    filterDescriptions.add(filter['اسم الصنف (إنجليزي)']);
                }
            });
        }

        Array.from(filterDescriptions).sort().forEach(description => {
            const option = document.createElement('option');
            option.value = description;
            option.textContent = description;
            filterDescriptionSelect.appendChild(option);
        });

        filterDescriptionSelect.disabled = !(selectedBrand && selectedModel);
    }

    // لجمع أرقام الفلاتر لخاصية البحث الفوري
    function collectPartNumbersForSearch() {
        allFilters.forEach(filter => {
            if (filter['رقم الفلتر (Part No)']) {
                partNumbers.add(filter['رقم الفلتر (Part No)']);
            }
        });
    }

    // 3. وظيفة عرض النتائج في جدول HTML (تم تعديل الأعمدة المعروضة)
    function displayResults(results) {
        searchResultsDiv.innerHTML = ''; // مسح النتائج السابقة
        resultsCountP.textContent = `عدد النتائج: ${results.length}`;

        if (results.length === 0) {
            searchResultsDiv.innerHTML = '<p class="no-results">لا توجد نتائج مطابقة.</p>';
            return;
        }

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');

        // تعريف رؤوس الأعمدة المراد عرضها فقط
        const headers = [
            'ماركة المعدة', 'الموديل', 'ماركة الفلتر', 'رقم الفلتر', 'كود المخزن'
        ];

        // الأعمدة المقابلة في كائن الفلتر (من ملف JSON)
        const dataKeys = [
            'الماركة الرئيسية للمعدة', 'موديل المعدة', 'الماركة (Part No)', 'رقم الفلتر (Part No)', 'كود المخزن'
        ];

        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        results.forEach(filter => {
            const tr = document.createElement('tr');
            dataKeys.forEach(key => {
                const td = document.createElement('td');
                td.textContent = filter[key] !== undefined && filter[key] !== null ? filter[key] : '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        searchResultsDiv.appendChild(table);
    }

    // 4. وظيفة البحث بناءً على القوائم المنسدلة الجديدة
    searchByDropdownsBtn.addEventListener('click', () => {
        const selectedMachineBrand = machineBrandSelect.value;
        const selectedMachineModel = machineModelSelect.value;
        const selectedFilterDescription = filterDescriptionSelect.value;

        if (!selectedMachineBrand && !selectedMachineModel && !selectedFilterDescription) {
            alert('الرجاء اختيار ماركة المعدة أو الموديل أو وصف الفلتر للبحث.');
            return;
        }

        const filteredResults = allFilters.filter(filter => {
            const matchesBrand = selectedMachineBrand ? filter['الماركة الرئيسية للمعدة'] === selectedMachineBrand : true;
            const matchesModel = selectedMachineModel ? filter['موديل المعدة'] === selectedMachineModel : true;
            const matchesDescription = selectedFilterDescription ? filter['اسم الصنف (إنجليزي)'] === selectedFilterDescription : true;
            return matchesBrand && matchesModel && matchesDescription;
        });

        displayResults(filteredResults);
    });

    // تحديث القوائم المنسدلة بشكل متسلسل
    machineBrandSelect.addEventListener('change', () => {
        populateMachineModels(machineBrandSelect.value);
    });

    machineModelSelect.addEventListener('change', () => {
        populateFilterDescriptions(machineBrandSelect.value, machineModelSelect.value);
    });

    // 5. وظيفة البحث الفوري برقم الفلتر (مع المقترحات) - لم تتغير جوهريًا
    partNoSearchInput.addEventListener('input', () => {
        const query = partNoSearchInput.value.trim().toLowerCase();
        suggestionsBox.innerHTML = ''; // مسح المقترحات السابقة

        if (query.length < 2) { // ابدأ إظهار المقترحات بعد حرفين
            return;
        }

        const matchingSuggestions = Array.from(partNumbers).filter(partNo =>
            partNo.toLowerCase().includes(query)
        ).slice(0, 10); // عرض 10 مقترحات فقط

        matchingSuggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                partNoSearchInput.value = suggestion;
                suggestionsBox.innerHTML = ''; // مسح المقترحات عند الاختيار
                searchByPartNo(suggestion); // البحث مباشرة عند اختيار اقتراح
            });
            suggestionsBox.appendChild(div);
        });
    });

    // إخفاء صندوق المقترحات عند النقر خارج حقل البحث
    document.addEventListener('click', (event) => {
        if (!partNoSearchInput.contains(event.target) && !suggestionsBox.contains(event.target)) {
            suggestionsBox.innerHTML = '';
        }
    });

    // 6. وظيفة البحث الكامل برقم الفلتر (عند الضغط على Enter أو اختيار اقتراح) - لم تتغير جوهريًا
    partNoSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = partNoSearchInput.value.trim();
            if (query) {
                searchByPartNo(query);
                suggestionsBox.innerHTML = ''; // مسح المقترحات بعد البحث
            }
        }
    });

    function searchByPartNo(query) {
        const lowerCaseQuery = query.toLowerCase();
        const results = allFilters.filter(filter =>
            filter['رقم الفلتر (Part No)'] && filter['رقم الفلتر (Part No)'].toLowerCase().includes(lowerCaseQuery)
        );

        // إذا وجدنا نتيجة لرقم فلتر معين، نعرض كل البدائل المرتبطة به
        // نفترض أن رقم "مسلسل" يربط البدائل بالرقم الرئيسي
        let finalResults = [];
        if (results.length > 0) {
            // جمع جميع أرقام المسلسل المطابقة
            const matchingSerials = new Set(results.map(f => f['مسلسل']));
            // عرض كل الفلاتر التي تشارك نفس رقم المسلسل
            finalResults = allFilters.filter(filter => matchingSerials.has(filter['مسلسل']));
        }

        displayResults(finalResults);
    }

    // 7. إضافة فلتر جديد (لم تتغير جوهريًا)
    showAddFilterFormBtn.addEventListener('click', () => {
        addFilterForm.classList.toggle('hidden');
    });

    addFilterBtn.addEventListener('click', () => {
        const newFilter = {};
        // جمع البيانات من حقول الإدخال
        newFilter['اسم الصنف (عربي)'] = document.getElementById('addFilterNameAr').value;
        newFilter['اسم الصنف (إنجليزي)'] = document.getElementById('addFilterNameEn').value;
        newFilter['نوع الفلتر'] = document.getElementById('addFilterType').value;
        newFilter['Part No الرئيسي'] = document.getElementById('addPartNo').value;
        newFilter['الماركة (Part No)'] = document.getElementById('addPartNoBrand').value;
        newFilter['رقم الفلتر (Part No)'] = document.getElementById('addPartNoNumber').value;
        newFilter['كود المخزن'] = document.getElementById('addStoreCode').value;
        newFilter['الماركة الرئيسية للمعدة'] = document.getElementById('addMachineBrand').value;
        newFilter['موديل المعدة'] = document.getElementById('addMachineModel').value;
        newFilter['المعدة الأصلية (الوصف)'] = document.getElementById('addOriginalMachineDesc').value;
        newFilter['نوع المعدة (عام)'] = document.getElementById('addGeneralMachineType').value;
        newFilter['مسلسل'] = allFilters.length > 0 ? Math.max(...allFilters.map(f => f['مسلسل'] || 0)) + 1 : 1;
        newFilter['Column2'] = null; // يمكنك تعيين قيمة افتراضية أو تركها فارغة

        // إضافة الفلتر الجديد إلى مصفوفة البيانات (في الذاكرة فقط)
        allFilters.push(newFilter);
        alert('تم إضافة الفلتر بنجاح (سيتم فقده عند تحديث الصفحة ما لم تقم بالتنزيل).');

        // تحديث القوائم المنسدلة وبيانات البحث
        populateMachineBrands(); // إعادة تعبئة القوائم
        collectPartNumbersForSearch(); // لإضافة رقم الفلتر الجديد للمقترحات

        // مسح حقول الإدخال
        document.querySelectorAll('#addFilterForm input').forEach(input => input.value = '');
    });

    // 8. وظيفة تنزيل البيانات المعدلة كملف JSON (لم تتغير جوهريًا)
    downloadDataBtn.addEventListener('click', () => {
        const jsonData = JSON.stringify(allFilters, null, 4); // تحويل البيانات إلى JSON مع تنسيق جميل
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'فلاتر_معدلة.json'; // اسم الملف الذي سيتم تنزيله
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // تحرير الذاكرة
        alert('تم تنزيل البيانات المعدلة. يرجى استبدال ملف "filters.json" بهذا الملف يدويًا للحفاظ على التغييرات.');
    });


    // تحميل البيانات عند بدء تشغيل الصفحة
    loadFilterData();
}); 